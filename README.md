# Book Club

Pick a book with your friends and read it together.

Book Club is a cross-platform app (iOS, Android and web) for small reading groups. Create a club, invite your friends, search for a book, and set it as the club's current read. Everyone sees what the group is reading on their Home screen.

Built with React Native, Expo and TypeScript, with [Appwrite](https://appwrite.io) as the backend.

## What it does

- **Home** greets you and lists every club you belong to, with the book each one is reading
- **Search** looks up any book by title using [Open Library](https://openlibrary.org/developers/api). If the first match is the wrong edition, a "wrong book?" picker shows alternates. Set the result as the current book for any of your clubs
- **Clubs** lets you create as many clubs as you like, invite people by email, join with an invite link, and leave a club
- **Profile** is where you set your display name

A few details I cared about:

- **Privacy by default.** Members see each other by display name only. Email addresses are never shown to other club members
- **Clubs never end up ownerless.** If the only owner leaves, ownership passes to the longest-standing member. If the last member leaves, the club is deleted
- **Low-friction sign-in.** Sign in with email, create an account, or continue as a guest to look around first
- **Invites work two ways.** Tap the emailed link to open the app, or paste the link into **Clubs > Join with an invite link**

## How it works

| Piece | How it's done |
| ----- | ------------- |
| Auth | Appwrite email/password and anonymous sessions |
| Clubs and membership | Appwrite Teams. A club is a team, and owner/member are team roles |
| Current book | Stored in the team's preferences, so every member reads the same value |
| Invites | Appwrite emails a link that opens the app at `/invite`, where the invite is accepted |
| Display names | A small `profiles` collection, one document per club membership. Appwrite can return blank names for other members and hides their user IDs, so each document is keyed by membership ID and only its owner can edit it |
| Book data and covers | Open Library Search API |

The logic that decides things like who inherits a club or whether a name looks like an email lives in small pure functions under `utils/`, and is covered by tests.

## Tech stack

- [Expo](https://expo.dev) (SDK 52) and React Native, with [Expo Router](https://docs.expo.dev/router/introduction) for file-based routing
- TypeScript in strict mode
- Appwrite for authentication, clubs and display names
- Open Library for book data
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

If you use a different database or collection ID, set `EXPO_PUBLIC_APPWRITE_DATABASE_ID` and `EXPO_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID` in `.env.local`.

The `profiles` collection holds display names only, never emails, and any signed-in user can read it. Without it the app still works, but other members show up as "Unnamed reader".

### 3. Start the app

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
app/            Screens and routes (login, invite, club detail, tabs: home, search, clubs, profile)
components/     Shared UI (BookCard, Screen, themed text and inputs)
services/       Appwrite and Open Library clients (+ tests)
utils/          Small pure helpers (+ tests)
types/          Shared TypeScript types
constants/      Color palette and radii
```

## Roadmap

- Reading history (previous books) per club
- Per-member progress and discussion notes
