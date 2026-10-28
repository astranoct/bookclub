# Book Club

A small cross-platform app (iOS, Android, web) for reading with friends. Search for a book, set it as your club's current read, and see what everyone is reading together.

## Features

- Sign in with email, create an account, or continue as a guest
- A Home screen that greets you and shows every club you're in with the book each is reading
- Search [Open Library](https://openlibrary.org/developers/api) by title, with a "wrong book?" picker for alternate matches
- Manage clubs: create several, invite people by email, accept invites (by link or paste), and leave a club. Leaving as the only owner hands ownership to another member, and leaving as the last member deletes the club
- Set a club's current book from the Search tab, choosing which club when you're in several
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
