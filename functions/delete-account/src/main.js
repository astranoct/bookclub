import { Account, Client, Users } from 'node-appwrite';

const INVALID_CREDENTIALS = { error: 'invalid_credentials' };

/**
 * Backs the "Delete all my information" screen. The app can't delete an account itself (the
 * client SDK can only block it), so this runs with a server key and does two things:
 *
 *   { action: "check" }                    does nothing, so the app can confirm this function is
 *                                         deployed and the caller is signed in before it deletes
 *                                         anything of its own
 *   { action: "verify", email, password }  checks the password belongs to the caller
 *   { action: "delete" }                   deletes the caller's account
 *
 * It only ever acts on the user Appwrite says made the request (x-appwrite-user-id), never on
 * an ID sent in the body, so nobody can delete someone else's account through it.
 * Passwords are never logged.
 */
export default async ({ req, res, error }) => {
  const userId = req.headers['x-appwrite-user-id'];
  if (!userId) {
    return res.json({ error: 'You need to be signed in.' }, 401);
  }

  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT;
  const project = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const users = new Users(
    new Client().setEndpoint(endpoint).setProject(project).setKey(req.headers['x-appwrite-key'])
  );
  const body = req.bodyJson ?? {};

  if (body.action === 'check') {
    return res.json({ ok: true });
  }

  if (body.action === 'verify') {
    const { email, password } = body;
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.json({ error: 'Enter your email and password.' }, 400);
    }

    // A client with no key and no session, so this is a normal sign-in attempt.
    let session;
    try {
      session = await new Account(
        new Client().setEndpoint(endpoint).setProject(project)
      ).createEmailPasswordSession({ email, password });
    } catch {
      return res.json(INVALID_CREDENTIALS, 401);
    }

    // The check is done, so don't leave the extra session behind.
    await users.deleteSession({ userId: session.userId, sessionId: session.$id }).catch(() => {});

    // The credentials must belong to the person making the request, not just any account.
    return session.userId === userId ? res.json({ ok: true }) : res.json(INVALID_CREDENTIALS, 401);
  }

  if (body.action === 'delete') {
    try {
      await users.delete({ userId });
      return res.json({ ok: true });
    } catch (e) {
      error(`Could not delete user ${userId}: ${e.message}`);
      return res.json({ error: 'Could not delete the account.' }, 500);
    }
  }

  return res.json({ error: 'Unknown action.' }, 400);
};
