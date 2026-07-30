# Trick or Trivia 2026

A live, porch-sized Halloween trivia game built for a four-hour drop-in event. Guests can play solo or as a team, choose questions from a shared game board, and compete across regular rounds and Dungeon Crawler Carl bonus floors.

## Current version: Phase 1 prototype

The current browser prototype includes:

- Porch display, host controls, and player-join views
- Solo and team entry modes
- Unified round and all-night leaderboards
- Six categories with five difficulty levels
- A selectable game board
- A 30-second question timer
- Answer reveal and host-controlled scoring
- A Dungeon Crawler Carl bonus-floor question
- New-round, board-reset, and clear-player controls
- Event open/closed status
- A host-controlled event-address safeguard

## Run locally

Open `index.html` in a modern browser. No installation or build step is required.

## Privacy design

This project is intended for a home-hosted event. The event address is deliberately **not committed to this public repository**. In the prototype, the host enters the address manually and controls whether it appears on public screens. In the synchronized production version, address visibility will remain off by default and will use protected event configuration rather than public source code.

## Prototype limitation

Phase 1 keeps all game state inside one browser tab. It demonstrates the flow, controls, scoring, and visual direction, but separate phones are not synchronized yet.

## Planned production routes

- `/display` — television or projector game board
- `/host` — private host dashboard
- `/play` — guest join and answer screen

Firebase Realtime Database is planned for shared rooms, live question state, answer locking, timers, scoring, late joining, moderation, reconnect support, and rolling leaderboards.

## Project structure

- `index.html` — Phase 1 interactive prototype
- `questions.sample.json` — proposed question-bank schema
- `docs/ROADMAP.md` — development phases and priorities
- `SECURITY.md` — privacy and home-address handling rules

## Status

Active development for Trick or Trivia 2026.
