import { AppwriteException, ExecutionMethod } from 'react-native-appwrite';

import { functions, getMyClubs, leaveClub, signOut } from '@/services/appwrite';
import { deleteMemberRows } from '@/services/clubData';
import type { SupportPayload } from '@/utils/support';

// Both of these run as Appwrite Functions, because the app itself can't delete an account
// or send email. See functions/README.md for how to deploy them.
const deleteFunctionId = process.env.EXPO_PUBLIC_APPWRITE_DELETE_FUNCTION_ID ?? 'delete-account';
const supportFunctionId = process.env.EXPO_PUBLIC_APPWRITE_SUPPORT_FUNCTION_ID ?? 'contact-support';

export type AccountErrorKind = 'not-configured' | 'wrong-credentials' | 'club' | 'failed';

export class AccountError extends Error {
  constructor(
    readonly kind: AccountErrorKind,
    message: string
  ) {
    super(message);
    this.name = 'AccountError';
  }
}

/** Runs one of the app's Appwrite Functions and turns anything but success into an AccountError. */
async function callFunction(functionId: string, payload: object) {
  let execution;
  try {
    execution = await functions.createExecution(
      functionId,
      JSON.stringify(payload),
      false,
      '/',
      ExecutionMethod.POST,
      { 'content-type': 'application/json' }
    );
  } catch (e) {
    if (e instanceof AppwriteException && e.code === 404) {
      throw new AccountError('not-configured', "This isn't set up in this version of the app yet.");
    }
    throw new AccountError('failed', e instanceof Error ? e.message : 'The request failed.');
  }

  let body: { error?: string } = {};
  try {
    body = JSON.parse(execution.responseBody || '{}');
  } catch {
    // A function that fails badly may not return JSON.
  }

  if (execution.responseStatusCode === 401 && body.error === 'invalid_credentials') {
    throw new AccountError('wrong-credentials', "That email and password don't match this account.");
  }
  if (execution.responseStatusCode >= 400 || execution.status === 'failed') {
    throw new AccountError('failed', body.error ?? 'The request failed. Please try again.');
  }
}

/** Checks the password on the server, since the app can't re-verify it while signed in. */
export function verifyPassword(email: string, password: string) {
  return callFunction(deleteFunctionId, { action: 'verify', email, password });
}

/**
 * Removes all of the signed-in user's data and then their account:
 * 0. checks the server side is deployed first, so nothing is removed if it isn't
 * 1. for every club, deletes their name, progress and suggestion, then leaves it (ownership
 *    passes to another member, and a club they were the only member of is deleted)
 * 2. deletes the account itself, which only the server can do
 * Safe to run again if it stops part way.
 */
export async function deleteEverything(onStep?: (text: string) => void) {
  await callFunction(deleteFunctionId, { action: 'check' });

  onStep?.('Removing your clubs and data...');
  const clubs = await getMyClubs();
  for (const club of clubs) {
    try {
      if (club.membershipId) await deleteMemberRows(club.membershipId);
      await leaveClub(club.id);
    } catch {
      throw new AccountError('club', `Could not remove you from "${club.name}".`);
    }
  }

  onStep?.('Deleting your account...');
  await callFunction(deleteFunctionId, { action: 'delete' });
  await signOut().catch(() => {
    // The session is already gone along with the account.
  });
}

export function sendSupportMessage(payload: SupportPayload) {
  return callFunction(supportFunctionId, payload);
}
