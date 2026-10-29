# Appwrite Functions

Two parts of the app can't run on the phone, so they run as [Appwrite Functions](https://appwrite.io/docs/products/functions) in your own project:

| Function | Why it can't live in the app |
| -------- | ----------------------------- |
| `delete-account` | The client SDK can only *block* an account. Actually deleting one needs the server Users API. It also checks the password the person re-enters, because the app can't re-verify it while signed in |
| `contact-support` | Sending email needs SMTP credentials, and the address that receives support messages should not be shipped inside the app or committed to a public repository |

Without them the app still runs. The Settings screen just reports that these two features aren't set up.

## Deploy

For each function, in the Appwrite console go to **Functions > Create function**, then:

1. Use the **Function ID** shown below, so the app finds it without any configuration. If you pick another ID, set the matching variable in `.env.local` (see `.env.example`).
2. Choose a current **Node.js** runtime.
3. Connect the GitHub repository and set the **root directory** to the function's folder, or upload the folder as a tar.gz.
4. Set the entrypoint to `src/main.js` and the build command to `npm install`.
5. Under **Settings > Execute access**, allow only the **Users** role (never **Any**).

### `delete-account`

- Function ID: `delete-account`
- **Scopes:** `users.read` and `users.write`
- No variables needed.

### `contact-support`

- Function ID: `contact-support`
- **Scopes:** none
- **Variables:**

| Variable | Value |
| -------- | ----- |
| `SUPPORT_TO` | The inbox that should receive support messages |
| `SMTP_HOST` | Your mail provider's SMTP host, for example `smtp.gmail.com` |
| `SMTP_PORT` | `465` for SSL (the default if left out) |
| `SMTP_USER` | The account used to send, for example the full Gmail address |
| `SMTP_PASSWORD` | An app password for that account, not its normal password |
| `SMTP_FROM` | Optional. Defaults to `SMTP_USER` |

For Gmail, turn on 2-step verification and create an app password. Keep every one of these as a function variable, and never commit them.

## Check that it works

- **Contact support:** in the app, go to Settings > Contact support and send a message. It should arrive at `SUPPORT_TO`, with the user's reply address (if they gave one) as the reply-to.
- **Delete account:** try it with a throwaway account first. It removes the person's clubs and data, then the account, and signs them out.

## How the delete function stays safe

- It only acts on the user Appwrite says made the request (`x-appwrite-user-id`). An ID in the request body is never used, so it can't be pointed at someone else's account.
- Re-entering the password is checked by signing in with a temporary session that is deleted straight away, and the credentials must belong to the caller.
- Passwords are never logged.
