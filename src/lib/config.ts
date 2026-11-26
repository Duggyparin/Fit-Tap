// Contact settings for the whole product. Replace the placeholders before a
// real gym uses the app. These are public values, never secrets.

export const SUPPORT_EMAIL = 'support@fittap.example' // placeholder

// Your Messenger page, for example "https://m.me/<your-page>". While empty,
// "Send feedback" writes an email to SUPPORT_EMAIL instead.
export const FEEDBACK_URL: string = ''

export function feedbackLink(): string {
  return FEEDBACK_URL || `mailto:${SUPPORT_EMAIL}?subject=FitTap%20feedback`
}
