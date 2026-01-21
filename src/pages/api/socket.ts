import type { NextApiRequest, NextApiResponse } from "next";
import { WebSocket, WebSocketServer } from "ws";

export const config = {
  api: {
    bodyParser: false,
  },
};

const SIZE = 15;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

type Cell = 0 | 1 | 2;
type Board = Cell[][];
type Role = "black" | "white" | "spectator";

type GameState = {
  board: Board;
  currentPlayer: Cell;
  winner: Cell;
  winningLine: Array<[number, number]>;
  moveCount: number;
  lastMove: [number, number] | null;
  isDraw: boolean;
};

type Client = WebSocket & { role?: Role; roomId?: string };

type Room = {
  id: string;
  state: GameState;
  clients: Set<Client>;
  players: { black: Client | null; white: Client | null };
};

const createBoard = (): Board =>
  Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => EMPTY));

const createState = (): GameState => ({
  board: createBoard(),
  currentPlayer: BLACK,
  winner: EMPTY,
  winningLine: [],
  moveCount: 0,
  lastMove: null,
  isDraw: false,
});

const inBounds = (row: number, col: number) =>
  row >= 0 && row < SIZE && col >= 0 && col < SIZE;

const checkWin = (board: Board, row: number, col: number) => {
  const player = board[row][col];
  if (!player) return null;
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

  for (const [dr, dc] of directions) {
    const line: Array<[number, number]> = [[row, col]];
    let r = row + dr; let c = col + dc;
    while (inBounds(r, c) && board[r][c] === player) {
      line.push([r, c]); r += dr; c += dc;
    }
    r = row - dr; c = col - dc;
    while (inBounds(r, c) && board[r][c] === player) {
      line.unshift([r, c]); r -= dr; c -= dc;
    }
    if (line.length >= 5) return { winner: player, line };
  }
  return null;
};

const rooms = new Map<string, Room>();

const getRoom = (roomId: string): Room => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      state: createState(),
      clients: new Set(),
      players: { black: null, white: null },
    });
  }
  return rooms.get(roomId)!;
};

const roomPlayers = (room: Room) => ({
  black: Boolean(room.players.black),
  white: Boolean(room.players.white),
});

const send = (ws: Client, payload: unknown) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
};


const broadcastState = (room: Room, initiator: Client) => {
  for (const client of room.clients) {
    send(client, {
      type: "state",
      state: room.state,
      role: client.role || "spectator",
      players: roomPlayers(room)
    });
  }
};

const setupWss = (server: any) => {
  if (server.wss) return server.wss as WebSocketServer;

  const wss = new WebSocketServer({ server, path: "/api/socket" });
  server.wss = wss;

  wss.on("connection", (raw) => {
    const ws = raw as Client;
    ws.role = "spectator";

    ws.on("message", (data) => {
      let message: any;
      try { message = JSON.parse(data.toString()); } catch { return; }

      if (message.type === "join") {
        const roomId = String(message.roomId || "").trim();
        if (!roomId) return;

        const room = getRoom(roomId);
        room.clients.add(ws);
        ws.roomId = roomId;

        if (!room.players.black) {
          room.players.black = ws;
          ws.role = "black";
        } else if (!room.players.white) {
          room.players.white = ws;
          ws.role = "white";
        }

        send(ws, {
          type: "welcome",
          role: ws.role,
          roomId,
          players: roomPlayers(room),
        });
        
        broadcastState(room, ws);
        return;
      }

      if (!ws.roomId) return;
      const room = rooms.get(ws.roomId);
      if (!room) return;

      if (message.type === "reset") {
        room.state = createState();
        broadcastState(room, ws);
        return;
      }

      if (message.type === "move") {
        const { row, col } = message;
        if (!inBounds(row, col) || room.state.board[row][col] !== EMPTY) return;
        if (room.state.winner) return;

        room.state.board[row][col] = room.state.currentPlayer;
        room.state.lastMove = [row, col];
        room.state.moveCount += 1;

        const result = checkWin(room.state.board, row, col);
        if (result) {
          room.state.winner = result.winner as Cell;
        } else {
          room.state.currentPlayer = room.state.currentPlayer === BLACK ? WHITE : BLACK;
        }

        broadcastState(room, ws);
      }
    });

    ws.on("close", () => {
      if (ws.roomId) {
        const room = rooms.get(ws.roomId);
        if (room) {
          room.clients.delete(ws);
          
          // Release player role if this client was a player
          if (room.players.black === ws) {
            room.players.black = null;
            broadcastState(room, ws);
          } else if (room.players.white === ws) {
            room.players.white = null;
            broadcastState(room, ws);
          }
          
          // Clean up empty rooms
          if (room.clients.size === 0) {
            rooms.delete(ws.roomId);
          }
        }
      }
    });
  });

  return wss;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  setupWss(res.socket.server);
  res.status(200).end();
}