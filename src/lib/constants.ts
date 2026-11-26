// App-wide settings kept in one place so they can become gym settings later.

// Every date and time in the app is shown and compared in Philippine time.
export const TIME_ZONE = 'Asia/Manila'

// A membership is "expiring" when it has this many days left or fewer.
export const EXPIRING_DAYS = 7

// Link mode: how long the scanner waits for a card (the database default).
export const LINK_SECONDS = 60
// A scanner is "online" if it was heard from this recently.
export const SCANNER_ONLINE_MINUTES = 2
// How far back "Choose from recent taps" looks.
export const RECENT_TAPS_HOURS = 3

// Default price on the Walk-in form (editable in Settings).
export const WALK_IN_DEFAULT_CENTAVOS = 100_00
