# Book Club

A small cross-platform app (iOS, Android, web) for reading with friends. Search for a book, set it as your club's current read, and see what everyone is reading together.

## Features

- Sign in with email, create an account, or continue as a guest
- Search [Open Library](https://openlibrary.org/developers/api) by title, with a "wrong book?" picker for alternate matches
- Create a club and share the current book with its members
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

### Scripts

| Command             | What it does                  |
| ------------------- | ----------------------------- |
| `npm start`         | Start the Expo dev server     |
| `npm test`          | Run the Jest tests            |
| `npm run typecheck` | Type-check with `tsc`         |
| `npm run lint`      | Lint with `expo lint`         |

## Project structure

```
app/            Screens and routes (login, tabs: search + club)
components/     Shared UI (BookCard, Screen, themed text/inputs)
services/       Appwrite and Open Library clients (+ tests)
types/          Shared TypeScript types
constants/      Color palette and radii
```

## Roadmap

- Join an existing club by invite instead of only creating one
- Reading history (previous books) per club
- Per-member progress and discussion notes
