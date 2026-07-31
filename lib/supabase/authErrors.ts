// Supabase Auth returns its error messages in English with no i18n hook of its
// own. Rather than showing raw English text on an otherwise fully-Hebrew form
// (confusing, and easy to mistake for "nothing happened" — see the real
// support case that prompted this: a user whose confirmation link had expired
// tried to sign in anyway, got back "Email not confirmed" verbatim, and
// reported the login button as unresponsive because the message didn't read
// as an error to them). Only the handful of messages this app can actually
// trigger are translated; anything unrecognized still shows Supabase's raw
// text rather than a made-up generic one, so a genuinely new failure mode
// stays diagnosable instead of being silently hidden.
const TRANSLATIONS: Record<string, string> = {
  'Invalid login credentials': 'אימייל או סיסמה שגויים.',
  'Email not confirmed': 'האימייל עדיין לא אושר. בדקו את תיבת הדואר ולחצו על קישור האישור, או הירשמו מחדש לקבלת קישור חדש.',
  'User already registered': 'כבר קיים חשבון עם האימייל הזה. נסו להתחבר במקום להירשם.',
  'Signup requires a valid password': 'הסיסמה אינה תקינה.',
  'Password should be at least 6 characters': 'הסיסמה חייבת להכיל לפחות 6 תווים.',
  'For security purposes, you can only request this after 60 seconds.': 'מסיבות אבטחה אפשר לבקש שוב רק אחרי 60 שניות.',
};

export function translateAuthError(message: string): string {
  return TRANSLATIONS[message] ?? message;
}
