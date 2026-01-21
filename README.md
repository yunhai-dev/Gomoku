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

## LAN Multiplayer
1. Start the dev server with `npm run dev` (binds to `0.0.0.0`).
2. Find your LAN IP (e.g. `192.168.1.10`) and open `http://<LAN-IP>:3000`.
3. Use the same Room ID on two devices. The first player is Black, the second is White.

If another device cannot connect, check your firewall or router settings.

## Project Structure
- `src/app/page.tsx` Game UI and rules
- `src/app/globals.css` Theme and board styling
- `src/app/layout.tsx` Fonts and metadata
- `src/pages/api/socket.ts` WebSocket room server

## Scripts
- `npm run dev` Start the dev server
- `npm run build` Production build
- `npm run start` Start the production server

## Notes
- This is a local two-player game (no AI or online play).
- Board size and rules can be adjusted in `src/app/page.tsx`.
