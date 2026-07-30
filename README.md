# Trick or Trivia 2026

## 🎃 Open the live haunted game

**[Launch Trick or Trivia](https://taraweidner.github.io/HalloweenTrickorTrivia/)**

Use the GitHub Pages link above for the actual game. The Firebase `.web.app` / `.firebaseapp.com` page is not the game frontend; Firebase is used behind the scenes for authentication and live synchronization.

A live, porch-sized Halloween trivia game built for a four-hour drop-in event. Guests can play solo or as a team, answer from their phones, and compete across regular rounds and Dungeon Crawler Carl bonus floors.

## Current version: Firebase-ready multiplayer test

The current browser build includes:

- Haunted porch display, host controls, and player views
- Anonymous Firebase sign-in
- Shared room code `CARL26`
- Live solo and team entry
- Synchronized questions, timers, answers, and scores
- Unified round and all-night leaderboards
- Six categories with five difficulty levels
- Host-controlled answer reveal and scoring
- Dungeon Crawler Carl bonus-floor treatment
- New-round, board-reset, and clear-player controls
- Event open/closed status
- A host-only event-address safeguard

## First live test

1. Open the live game link above on the host computer.
2. Hard refresh the page.
3. Confirm the badge says **Live room CARL26**.
4. Open **Host Controls** and select **Claim Host Controls**.
5. Open the same link on a phone and join as a player or team.
6. Launch a question and confirm it appears on the phone automatically.

## Privacy design

This project is intended for a home-hosted event. The event address is deliberately **not committed to this public repository**. The host enters it manually, and public visibility remains off by default. The private address is stored in a host-only Firebase path and removed from the public path whenever visibility is disabled.

## Project structure

- `index.html` — haunted game interface
- `app-live.js` — Firebase multiplayer engine
- `questions-live.js` — live question bank
- `firebase-config.js` — Firebase web project configuration
- `database.rules.json` — Realtime Database security rules
- `FIREBASE_SETUP.md` — Firebase setup and host recovery guide
- `SECURITY.md` — privacy and address-handling rules

## Status

Active multiplayer testing for Trick or Trivia 2026.
