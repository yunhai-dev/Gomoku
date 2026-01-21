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


const broadcastState = (room: Room) => {
  for (const client of room.clients) {
    send(client, {
      type: "state",
      state: room.state,
      role: client.role || "spectator",
      players: roomPlayers(room)
    });
  }
};

// 全局WebSocket服务器实例
let wss: WebSocketServer | null = null;

// 初始化WebSocket服务器
const initWss = (server: any) => {
  if (wss) return wss;

  console.log("Initializing WebSocket server...");
  
  // 简单的WebSocket服务器配置，不指定path以避免冲突
  wss = new WebSocketServer({
    server
  });

  console.log("WebSocket server initialized successfully");

  wss.on("connection", (raw, req) => {
    // 检查请求路径是否正确
    if (!req.url?.includes('/api/socket')) {
      console.log(`Rejecting connection from ${req.socket.remoteAddress} to invalid path: ${req.url}`);
      raw.close();
      return;
    }
    
    console.log(`WebSocket connection from ${req.socket.remoteAddress}:${req.socket.remotePort}`);
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
        
        broadcastState(room);
        return;
      }

      if (!ws.roomId) return;
      const room = rooms.get(ws.roomId);
      if (!room) return;

      if (message.type === "reset") {
        room.state = createState();
        broadcastState(room);
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

        broadcastState(room);
      }
    });

    ws.on("close", () => {
      if (ws.roomId) {
        const room = rooms.get(ws.roomId);
        if (room) room.clients.delete(ws);
      }
    });
  });

  return wss;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`WebSocket API handler called with method: ${req.method}, url: ${req.url}`);
  
  // 确保WebSocket服务器已初始化
  initWss(res.socket.server);
  
  // 如果是WebSocket请求，返回200 OK
  if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
    console.log("WebSocket upgrade request received");
    // WebSocket服务器会自动处理升级
  }
  
  res.status(200).end();
}