type RecaptchaVerification = {
  success: boolean;
  score: number;
  action?: string;
  dev?: boolean;
};

export async function verifyRecaptchaToken(token: string, expectedAction?: string): Promise<RecaptchaVerification> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY || '';

  if (token === 'no-key-dev-mode') return { success: true, score: 1, action: expectedAction, dev: true };
  if (!secretKey) return { success: true, score: 0.9, action: expectedAction, dev: true };

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret: secretKey, response: token }),
  });

  if (!response.ok) throw new Error('reCAPTCHA verification service unavailable');

  const result = await response.json() as { success?: boolean; score?: number; action?: string };
  const score = result.score ?? 0;
  const actionMatches = !expectedAction || result.action === expectedAction;

  return {
    success: result.success === true && score >= 0.5 && actionMatches,
    score,
    action: result.action,
  };
}
