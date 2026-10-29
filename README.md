# Book Club

A small cross-platform app (iOS, Android, web) for reading with friends. Search for a book, set it as your club's current read, and see what everyone is reading together.

## Features

- Sign in with email, create an account, or continue as a guest
- A Home screen that greets you and shows every club you're in with the book each is reading
- Search [Open Library](https://openlibrary.org/developers/api) by title, with a "wrong book?" picker for alternate matches
- Manage clubs: create several, invite people by email, accept invites (by link or paste), and leave a club. Leaving as the only owner hands ownership to another member, and leaving as the last member deletes the club
- Set a club's current book from the Search tab, choosing which club when you're in several
- Shared reading progress: each member logs their page and everyone sees how far along the club is
- Owners schedule the next meeting (date, time and a short note) for all members to see
- Owners finish a book, which moves it to the club's finished list
- Any member can suggest a book, and owners can pick from the suggestions
- Profile screen to set a display name; club members are shown by name only, never by email
- A dark, modern UI built on a small design system (`constants/Colors.ts`, `Button`, `Card`, `BookCard`)

## Tech stack

- [Expo](https://expo.dev) (SDK 52) and React Native, with [Expo Router](https://docs.expo.dev/router/introduction) for file-based routing
- TypeScript in strict mode
- [Appwrite](https://appwrite.io) for authentication and clubs (Teams; the current book is stored in the team's preferences)
- Open Library Search API for book data and covers
- Jest with `jest-expo` for tests

## Getting started

You need Node 18+ and an Appwrite project (Appwrite Cloud's free tier works) with a platform registered for the app's bundle/package ID.

```bash
npm install
cp .env.example .env.local   # then fill in your Appwrite project ID and endpoint
npx expo start
```

Open it in Expo Go, an emulator, or the browser (press `w`).

### Appwrite setup

In the Appwrite console for your project:

1. **Platforms:** add an Android platform with package name `com.boosterlong.bookclub` (and a Web platform for `localhost` if you want the browser build).
2. **Auth → Settings:** enable Email/Password and Anonymous sessions.
3. **Auth → Policies → Memberships → Privacy:** tick **Email** (and MFA status). Emails then aren't sent to other club members.
4. **Databases:** create a database and note its ID (if it isn't `bookclub`, set `EXPO_PUBLIC_APPWRITE_DATABASE_ID`). Inside it, create a table (called a collection in older consoles) with the ID `profiles`:
   - **Settings → Permissions:** give the **Users** role **Create** and **Read**, and turn on **Row security** (Document security in older consoles).
   - **Columns:** add a required `name` column. Use a text type of at most 128 characters; call it `name`.

Display names live in `profiles` because Appwrite's own membership names can come back blank for other members. Appwrite also hides other members' user IDs, so there is one document per club membership (ID = membership ID), written by the member it belongs to. The collection holds names only, never emails. Any signed-in user can read it, so treat display names as visible to everyone using the app. Without the collection, the app still works but other members appear as "Unnamed reader".

### Club roles

- **Owners** choose or change the current book, finish it, schedule meetings, invite people, and pick from suggestions.
- **Members** log their own progress and suggest one book at a time.

Owner-controlled data (current book, meeting, finished books) is stored in the team's preferences, which only owners can change. Member-written data is stored in two more tables, one row per club membership, readable by that club's members and changeable only by the member it belongs to.

To set those up, create two more tables in the same database (same steps as `profiles`: give the **Users** role **Create** only, and turn on **Row security**; no table-level Read is needed):

| Table ID      | Columns (all required)                                            |
| ------------- | ----------------------------------------------------------------- |
| `progress`    | `clubId` (text), `bookKey` (text), `page` (integer, min 0)         |
| `suggestions` | `clubId` (text), `book` (text, holds JSON, so use a long text type) |

Without them the app still works. Progress and suggestions just won't save.

A member of a club could, in theory, create the row for another member of the same club before they do. Preventing that would need a server function, which is out of scope here.

### Invites

Owners invite by email from a club's page. Appwrite emails a link that opens the app at `/invite`, which accepts it. Appwrite only allows redirect URLs on hosts registered as platforms in your project, so if sending an invite is rejected, register a Web platform and set `EXPO_PUBLIC_INVITE_URL` (see `.env.example`). Members can always paste the emailed link into **Clubs > Join with an invite link**.

### Scripts

| Command             | What it does                  |
| ------------------- | ----------------------------- |
| `npm start`         | Start the Expo dev server     |
| `npm test`          | Run the Jest tests            |
| `npm run typecheck` | Type-check with `tsc`         |
| `npm run lint`      | Lint with `expo lint`         |

## Project structure

```
app/            Screens and routes (login, invite, club detail, tabs: home, search, clubs, profile)
components/     Shared UI (BookCard, Screen, themed text/inputs)
services/       Appwrite and Open Library clients (+ tests)
utils/          Small pure helpers (+ tests)
types/          Shared TypeScript types
constants/      Color palette and radii
```

## Roadmap

- Join an existing club by invite instead of only creating one
- Reading history (previous books) per club
- Per-member progress and discussion notes
