// =====================================================================
// Gym NFC Scanner - firmware v1.3 (online-only)
// ESP32 + PN532 (SPI) + optional SSD1306 OLED + LEDs + buzzer
//
// What it does: reads an NFC card, asks the check-in server whether the
// member may enter (or whether a card is being linked), then shows the
// result with lights, beeps and text.
//
// Online-only: if the internet is down, the scanner shows "Offline" and
// staff check members in manually. Offline mode is a later stage.
//
// Before uploading: copy secrets.example.h to secrets.h and fill it in.
// Not yet tested on real hardware: expect small fixes.
// =====================================================================

#include <SPI.h>
#include <Wire.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Adafruit_PN532.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>
#include "secrets.h"   // WIFI_SSID, WIFI_PASS, CHECKIN_URL, SCANNER_TOKEN

// ---------- Pins ----------
#define PN532_SS 5          // PN532 chip select (SCK 18, MISO 19, MOSI 23)
const int GREEN_LED = 25;
const int RED_LED   = 26;
const int BUZZER    = 27;
// OLED uses the default I2C pins: SDA 21, SCL 22

// ---------- Settings ----------
const unsigned long SAME_CARD_IGNORE_MS = 3000;   // ignore the same card for 3 s
const unsigned long WIFI_RETRY_MS       = 10000;  // try to reconnect every 10 s
const uint16_t      READ_TIMEOUT_MS     = 200;    // how long to wait for a card
const uint16_t      HTTP_TIMEOUT_MS     = 2500;   // how long to wait for the server

// ---------- Devices ----------
Adafruit_PN532   nfc(PN532_SS);
Adafruit_SSD1306 display(128, 64, &Wire, -1);
bool displayOk = false;

// ---------- State ----------
String        lastUid       = "";
unsigned long lastTapMs     = 0;
unsigned long lastWifiTryMs = 0;
bool          wasOnline     = false;   // to refresh the idle screen on change

// The server's answer, filled in by checkOnline()
struct CheckResult {
  bool   answered = false;   // false = no usable reply (offline or error)
  int    httpCode = 0;       // HTTP status code, for error messages
  String mode;               // "checkin" or "link"
  bool   allowed  = false;   // check-in result
  bool   linked   = false;   // link mode result
  String name;               // member's first name
  String reason;             // ok, expired, unknown, disabled,
                             // already_linked or other_gym
  int    daysLeft = 0;
};

// ---------- Helpers ----------

// Turn the card's ID bytes into text like "04A1B2C3D4E5F6"
String uidToString(const uint8_t *uid, uint8_t len) {
  String s = "";
  for (uint8_t i = 0; i < len; i++) {
    if (uid[i] < 0x10) s += "0";
    s += String(uid[i], HEX);
  }
  s.toUpperCase();
  return s;
}

// Two lines of text on the OLED (does nothing if there is no OLED)
void showText(const String &line1, const String &line2) {
  if (!displayOk) return;
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(2);
  display.setCursor(0, 8);
  display.println(line1);
  display.setTextSize(1);
  display.setCursor(0, 40);
  display.println(line2);
  display.display();
}

void showIdle() {
  showText("Ready", WiFi.status() == WL_CONNECTED ? "Tap your card"
                                                  : "Offline - see desk");
}

// Green + one beep, or red + two beeps
void signal(bool ok) {
  digitalWrite(ok ? GREEN_LED : RED_LED, HIGH);
  int beeps = ok ? 1 : 2;
  for (int i = 0; i < beeps; i++) {
    digitalWrite(BUZZER, HIGH); delay(120);
    digitalWrite(BUZZER, LOW);  delay(120);
  }
  delay(1200);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, LOW);
}

// Start Wi-Fi; the ESP32 keeps retrying in the background
void startWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  showText("Wi-Fi...", WIFI_SSID);
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) delay(250);
  Serial.println(WiFi.status() == WL_CONNECTED ? "Wi-Fi OK" : "Wi-Fi not connected yet");
  lastWifiTryMs = millis();
}

// Extra nudge if the connection stays down
void keepWifiAlive() {
  bool online = WiFi.status() == WL_CONNECTED;
  if (online != wasOnline) {           // connection came back or dropped
    wasOnline = online;
    showIdle();
  }
  if (online) return;
  if (millis() - lastWifiTryMs < WIFI_RETRY_MS) return;
  lastWifiTryMs = millis();
  Serial.println("Reconnecting Wi-Fi...");
  WiFi.reconnect();
}

// ---------- Server call ----------

// Send the card ID to the check-in server and read its answer
CheckResult checkOnline(const String &uid) {
  CheckResult r;
  if (WiFi.status() != WL_CONNECTED) return r;

  WiFiClientSecure client;
  client.setInsecure();   // PROTOTYPE ONLY: replace with setCACert() before a pilot
  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  if (!http.begin(client, CHECKIN_URL)) return r;
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-scanner-token", SCANNER_TOKEN);

  JsonDocument req;
  req["uid"] = uid;
  String body;
  serializeJson(req, body);

  r.httpCode = http.POST(body);
  if (r.httpCode == 200) {
    JsonDocument res;
    if (!deserializeJson(res, http.getString())) {
      r.answered = true;
      r.mode     = String(res["mode"] | "checkin");
      r.allowed  = res["allowed"] | false;
      r.linked   = res["linked"] | false;
      r.name     = String(res["name"] | "");
      r.reason   = String(res["reason"] | "");
      r.daysLeft = res["days_left"] | 0;
    }
  } else {
    Serial.printf("HTTP error %d\n", r.httpCode);
  }
  http.end();
  return r;
}

// ---------- Show the result ----------

void handleResult(const CheckResult &r) {
  if (!r.answered) {
    if (r.httpCode == 401) showText("Error", "Scanner not authorized");
    else                   showText("Offline", "See front desk");
    signal(false);
  } else if (r.mode == "link") {
    String why = r.reason == "already_linked" ? "Card already in use"
                                              : "Other gym's card";
    showText(r.linked ? "Card linked" : "Not linked", r.linked ? r.name : why);
    signal(r.linked);
  } else if (r.allowed) {
    String left = r.daysLeft == 0 ? "Last day today"
                                  : String(r.daysLeft) + " days left";
    showText("Hi " + r.name, left);
    signal(true);
  } else {
    String why = r.reason == "expired"  ? "Membership expired"
               : r.reason == "disabled" ? "Card disabled"
                                        : "Unknown card";
    showText("Denied", why);
    signal(false);
  }
  showIdle();
}

// ---------- Main program ----------

void setup() {
  Serial.begin(115200);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  displayOk = display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  if (!displayOk) Serial.println("OLED not found (optional, continuing)");
  showText("Starting", "");

  nfc.begin();
  uint32_t version = nfc.getFirmwareVersion();
  if (!version) {
    Serial.println("PN532 not found. Check wiring and DIP switches.");
    showText("Reader", "not found");
    while (true) { signal(false); delay(3000); }   // stop here, keep warning
  }
  Serial.printf("Found PN5%02X, firmware %d.%d\n", (version >> 24) & 0xFF,
                (version >> 16) & 0xFF, (version >> 8) & 0xFF);
  nfc.SAMConfig();

  startWifi();
  wasOnline = WiFi.status() == WL_CONNECTED;
  showIdle();
}

void loop() {
  keepWifiAlive();

  uint8_t uid[7];
  uint8_t uidLength;
  if (!nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, READ_TIMEOUT_MS)) {
    return;   // no card this time; loop() runs again immediately
  }

  String id = uidToString(uid, uidLength);
  if (id == lastUid && millis() - lastTapMs < SAME_CARD_IGNORE_MS) return;
  lastUid = id;
  lastTapMs = millis();

  Serial.println("Card: " + id);
  showText("Checking...", "");
  handleResult(checkOnline(id));
}
