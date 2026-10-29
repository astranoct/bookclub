# Book Club

Pick a book with your friends and read it together.

Book Club is a cross-platform app (iOS, Android and web) for small reading groups. Create a club, invite your friends, search for a book, and set it as the club's current read. Everyone sees what the group is reading, how far along each person is, and when you next meet.

Built with React Native, Expo and TypeScript, with [Appwrite](https://appwrite.io) as the backend.

## What it does

- **Home** greets you and lists every club you belong to: the book each one is reading, your own progress, and the next meeting
- **Book search** isn't a tab. It opens from a club when you choose or suggest a book, and looks up any title using [Open Library](https://openlibrary.org/developers/api). If the first match is the wrong edition, a "wrong book?" picker shows alternates. Owners set the result as the club's current book, and members suggest it
- **Clubs** lets you create as many clubs as you like, invite people by email, join with an invite link, and leave a club. Each club's page brings it together:
  - the current book, which owners can finish to move it to the club's finished list
  - everyone's reading progress, where each member logs their own page
  - the next meeting, which owners schedule with a date, time and note
  - suggestions, where any member can propose a book and owners pick the next one
- **Profile** is where you set your display name
- **Settings** has a contact form for support, a donate link, and **Delete all my information**, which removes your clubs, data and account after you re-enter your email and password

A few details I cared about:

- **Privacy by default.** Members see each other by display name only. Email addresses are never shown to other club members
- **Clubs never end up ownerless.** If the only owner leaves, ownership passes to the longest-standing member. If the last member leaves, the club is deleted
- **Owners and members have different powers.** Owners choose and finish the book, schedule meetings and send invites. Everyone logs their own progress and can suggest one book at a time. "Find a book to suggest" only ever adds a suggestion, so it can never replace the current book
- **Low-friction sign-in.** Sign in with email, create an account, or continue as a guest to look around first
- **Invites work two ways.** Tap the emailed link to open the app, or paste the link into **Clubs > Join with an invite link**

## How it works

| Piece | How it's done |
| ----- | ------------- |
| Auth | Appwrite email/password and anonymous sessions |
| Clubs and membership | Appwrite Teams. A club is a team, and owner/member are team roles |
| Current book, meeting and finished books | Stored in the team's preferences. Only owners can write those, which matches who is allowed to change them. Saves merge into what is already there, so scheduling a meeting never wipes the current book |
| Reading progress and suggestions | Two tables with one row per club membership, readable by that club's members and changeable only by the member it belongs to. Progress is tied to the current book, so it starts over when the book changes |
| Invites | Appwrite emails a link that opens the app at `/invite`, where the invite is accepted |
| Display names | A small `profiles` collection, one document per club membership. Appwrite can return blank names for other members and hides their user IDs, so each document is keyed by membership ID and only its owner can edit it |
| Deleting an account | An Appwrite Function. The client SDK can only block an account, so a function with a server key checks the password you re-enter, then deletes the account. The app removes your name, progress, suggestions and club memberships first |
| Support messages | An Appwrite Function emails them over SMTP. The address that receives them lives only in the function's variables, so it isn't in the app or this repository |
| Book data and covers | Open Library Search API |

The logic that decides things like who inherits a club, whether a name looks like an email, or whether a suggestion is still relevant lives in small pure functions under `utils/`, and is covered by tests.

## Tech stack

- [Expo](https://expo.dev) (SDK 52) and React Native, with [Expo Router](https://docs.expo.dev/router/introduction) for file-based routing
- TypeScript in strict mode
- Appwrite for authentication, clubs, display names, progress and suggestions
- Open Library for book data
- Appwrite Functions (Node) for the two things the app can't do itself: deleting an account and sending support email
- Native date and time pickers via `@react-native-community/datetimepicker`
- Jest with `jest-expo` for tests
- A small hand-rolled dark design system (`constants/Colors.ts`, `Button`, `Card`, `BookCard`)

## Run it yourself

You need **Node 18+** and a free [Appwrite Cloud](https://cloud.appwrite.io) project.

### 1. Install and configure

```bash
git clone https://github.com/astranoct/bookclub.git
cd bookclub
npm install
cp .env.example .env.local
```

Open `.env.local` and fill in your Appwrite **project ID** and **endpoint**. Both are shown in your project's Settings page in the Appwrite console. The project ID is an identifier, not a secret.

### 2. Set up Appwrite

In the Appwrite console for your project:

1. **Platforms:** add an Android platform with the package name `com.boosterlong.bookclub`. For the browser build, also add a Web platform for `localhost`
2. **Auth > Settings:** enable **Email/Password** and **Anonymous** sessions
3. **Auth > Policies > Memberships > Privacy:** tick **Email** (and MFA status), so emails aren't shared with other club members
4. **Databases:** create a database with the ID `bookclub`. Inside it, create a table (called a collection in older consoles) with the ID `profiles`:
   - **Settings > Permissions:** give the **Users** role **Create** and **Read**, and turn on **Row security** (Document security in older consoles)
   - **Columns:** add a required text column called `name`, 128 characters at most
5. **Progress and suggestions:** in the same database, create two more tables. Give each the **Users** role **Create** only (no table-level Read, because each row is made readable to its club when it is saved) and turn on **Row security**:

   | Table ID | Columns (all required) |
   | -------- | ---------------------- |
   | `progress` | `clubId` (text), `bookKey` (text), `page` (integer, minimum 0) |
   | `suggestions` | `clubId` (text), `book` (a long text column, since it holds JSON) |

If you use a different database or table ID, set `EXPO_PUBLIC_APPWRITE_DATABASE_ID`, `EXPO_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID`, `EXPO_PUBLIC_APPWRITE_PROGRESS_COLLECTION_ID` and `EXPO_PUBLIC_APPWRITE_SUGGESTIONS_COLLECTION_ID` in `.env.local`.

The `profiles` collection holds display names only, never emails, and any signed-in user can read it. Without it the app still works, but other members show up as "Unnamed reader". Without the `progress` and `suggestions` tables the app still works too, but progress and suggestions won't save.

One limitation: a member of a club could in theory create another member's row in that same club before they do. Preventing that would need a server function, so the app assumes the people in a club trust each other.

### 3. Deploy the two functions (optional)

Account deletion and the support form run as small Appwrite Functions. See [`functions/README.md`](functions/README.md) for the steps. Without them the rest of the app works, and Settings reports that those two features aren't set up.

### 4. Start the app

```bash
npx expo start
```

Open it in Expo Go on your phone, an emulator, or the browser (press `w`). The login screen has a **connection check** that confirms your endpoint, project ID and platform are all correct.

### Sending invites

Owners invite people by email from a club's page. Appwrite only allows redirect URLs on hosts registered as platforms in your project. If sending an invite is rejected, register a Web platform and set `EXPO_PUBLIC_INVITE_URL` in `.env.local` (see `.env.example`). Invitees can always paste the emailed link into **Clubs > Join with an invite link**.

## Scripts

| Command             | What it does              |
| ------------------- | ------------------------- |
| `npm start`         | Start the Expo dev server |
| `npm test`          | Run the Jest tests        |
| `npm run typecheck` | Type-check with `tsc`     |
| `npm run lint`      | Lint with `expo lint`     |

## Project structure

```
app/            Screens and routes (login, invite, club detail, book search, tabs: home, clubs, profile)
components/     Shared UI (BookCard, Screen, themed text and inputs) and the club page cards in club/
services/       Appwrite and Open Library clients (+ tests)
functions/      Appwrite Functions for account deletion and support email, deployed separately
utils/          Small pure helpers (+ tests)
types/          Shared TypeScript types
constants/      Color palette and radii
```

## Roadmap

- Discussion notes for each book
- Reminders before a meeting
