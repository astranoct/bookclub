import nodemailer from 'nodemailer';

const MIN_LENGTH = 10;
const MAX_LENGTH = 2000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Backs the "Contact support" screen. It emails the message to whoever SUPPORT_TO is set to.
 * That address lives only in this function's variables, so it never appears in the app, in
 * its network traffic or in the repository.
 *
 * Variables to set: SUPPORT_TO, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD and,
 * optionally, SMTP_FROM.
 */
export default async ({ req, res, error }) => {
  const userId = req.headers['x-appwrite-user-id'];
  if (!userId) {
    return res.json({ error: 'You need to be signed in.' }, 401);
  }

  const body = req.bodyJson ?? {};
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (message.length < MIN_LENGTH || message.length > MAX_LENGTH) {
    return res.json({ error: `Messages must be ${MIN_LENGTH} to ${MAX_LENGTH} characters.` }, 400);
  }

  const replyEmail =
    typeof body.replyEmail === 'string' && EMAIL_PATTERN.test(body.replyEmail.trim())
      ? body.replyEmail.trim()
      : undefined;
  const appVersion = typeof body.appVersion === 'string' ? body.appVersion.slice(0, 40) : 'unknown';
  const platform = typeof body.platform === 'string' ? body.platform.slice(0, 40) : 'unknown';

  const port = Number(process.env.SMTP_PORT ?? 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: process.env.SUPPORT_TO,
      replyTo: replyEmail,
      subject: 'Book Club support message',
      text: [
        message,
        '',
        '---',
        `Reply to: ${replyEmail ?? '(not given)'}`,
        `App version: ${appVersion}`,
        `Platform: ${platform}`,
        `User ID: ${userId}`,
      ].join('\n'),
    });
    return res.json({ ok: true });
  } catch (e) {
    error(`Could not send support email: ${e.message}`);
    return res.json({ error: 'Could not send your message.' }, 500);
  }
};
