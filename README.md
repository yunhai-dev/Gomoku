# Five in a Row (Gomoku)

Single-device Gomoku built with Next.js. Two players take turns placing stones on a 15×15 board; first to connect five wins.

## Features
- 15×15 board with star points
- Win detection (horizontal, vertical, diagonal)
- Move counter and last-move indicator
- Highlighted winning line
- Responsive layout for desktop and mobile

## Getting Started
```bash
npm install
npm run dev
```

Open `http://localhost:3000` to play.

## Project Structure
- `src/app/page.tsx` Game UI and rules
- `src/app/globals.css` Theme and board styling
- `src/app/layout.tsx` Fonts and metadata

## Scripts
- `npm run dev` Start the dev server
- `npm run build` Production build
- `npm run start` Start the production server

## Notes
- This is a local two-player game (no AI or online play).
- Board size and rules can be adjusted in `src/app/page.tsx`.
