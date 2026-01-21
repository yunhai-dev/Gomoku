"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

type PlayerSlots = {
  black: boolean;
  white: boolean;
};

const createBoard = (): Board =>
  Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => EMPTY));

const createEmptyState = (): GameState => ({
  board: createBoard(),
  currentPlayer: BLACK,
  winner: EMPTY,
  winningLine: [],
  moveCount: 0,
  lastMove: null,
  isDraw: false,
});

const starPoints = new Set(
  [
    [3, 3],
    [3, 11],
    [7, 7],
    [11, 3],
    [11, 11],
  ].map(([r, c]) => `${r}-${c}`),
);

const toLabel = (row: number, col: number) => {
  const letters = "ABCDEFGHIJKLMNO";
  return `${letters[col]}${row + 1}`;
};

const createRoomId = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();

export default function Home() {
  const [gameState, setGameState] = useState<GameState>(createEmptyState);
  const [roomId, setRoomId] = useState("");
  const [role, setRole] = useState<Role>("spectator");
  const [players, setPlayers] = useState<PlayerSlots>({
    black: false,
    white: false,
  });
  const [connection, setConnection] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incomingRoom = params.get("room");
    if (incomingRoom) {
      setRoomId(incomingRoom.toUpperCase());
    } else {
      setRoomId(createRoomId());
    }
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const connect = () => {
    if (!roomId.trim()) {
      setError("Room ID is required.");
      return;
    }

    setError(null);
    setConnection("connecting");

    wsRef.current?.close();

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${window.location.host}/api/socket`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join", roomId: roomId.trim() }));
    };

    ws.onmessage = (event) => {
      let message: any;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }

      if (message.type === "welcome") {
        setRole(message.role || "spectator");
        setPlayers(message.players || { black: false, white: false });
        setConnection("connected");
        return;
      }

      if (message.type === "state") {
        setGameState(message.state);
        setRole(message.role || "spectator");
        setPlayers(message.players || { black: false, white: false });
        setConnection("connected");
        return;
      }

      if (message.type === "error") {
        setError(message.message || "Unknown error.");
      }
    };

    ws.onclose = () => {
      setConnection("disconnected");
      setRole("spectator");
      setPlayers({ black: false, white: false });
    };

    ws.onerror = () => {
      setError("Connection failed. Check the server and network.");
    };
  };

  const disconnect = () => {
    wsRef.current?.close();
    wsRef.current = null;
  };

  const handleReset = () => {
    if (connection !== "connected" || !wsRef.current) {
      setError("Connect to a room before resetting.");
      return;
    }
    wsRef.current.send(JSON.stringify({ type: "reset" }));
  };

  const handleMove = (row: number, col: number) => {
    if (connection !== "connected" || !wsRef.current) {
      setError("Connect to a room before playing.");
      return;
    }
    wsRef.current.send(JSON.stringify({ type: "move", row, col }));
  };

  const statusText = useMemo(() => {
    if (gameState.winner === BLACK) return "Black wins!";
    if (gameState.winner === WHITE) return "White wins!";
    if (gameState.isDraw) return "Draw — the board is full.";
    return gameState.currentPlayer === BLACK ? "Black to move" : "White to move";
  }, [gameState]);

  const winningSet = useMemo(() => {
    return new Set(
      gameState.winningLine.map(([r, c]) => `${r}-${c}`),
    );
  }, [gameState.winningLine]);

  const roleLabel =
    role === "spectator" ? "Spectator" : role === "black" ? "Black" : "White";
  const turnLabel =
    gameState.currentPlayer === BLACK ? "Black" : "White";
  const canPlay =
    connection === "connected" &&
    ((gameState.currentPlayer === BLACK && role === "black") ||
      (gameState.currentPlayer === WHITE && role === "white"));

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}?room=${encodeURIComponent(roomId)}`
    : "";

  return (
    <div className="app">
      <main className="stage">
        <section className="panel">
          <p className="eyebrow">LAN Gomoku</p>
          <h1>Five in a Row</h1>
          <p className="subtitle">
            Connect to the same room on two devices. The first to connect plays
            Black, the second plays White.
          </p>

          <div className="network-card">
            <div className="network-row">
              <label className="status-label" htmlFor="roomId">
                Room ID
              </label>
              <input
                id="roomId"
                className="text-input"
                value={roomId}
                onChange={(event) => setRoomId(event.target.value.toUpperCase())}
                placeholder="ROOM"
              />
            </div>
            <div className="network-actions">
              {connection === "connected" ? (
                <button className="ghost" onClick={disconnect}>
                  Disconnect
                </button>
              ) : (
                <button className="primary" onClick={connect}>
                  {connection === "connecting" ? "Connecting..." : "Connect"}
                </button>
              )}
              <button
                className="ghost"
                onClick={() => setRoomId(createRoomId())}
              >
                New Room
              </button>
            </div>
            <div className="network-info">
              <span className="badge">
                {connection === "connected" ? "Online" : "Offline"}
              </span>
              <span>
                Role: <strong>{roleLabel}</strong>
              </span>
              <span>
                Players:{" "}
                {players.black ? "Black ✓" : "Black —"} /{" "}
                {players.white ? "White ✓" : "White —"}
              </span>
            </div>
            <p className="share">
              Share URL: <span>{shareUrl || "—"}</span>
            </p>
            {error && <p className="error">{error}</p>}
          </div>

          <div className="status-card">
            <div className="status-row">
              <span className="status-label">Status</span>
              <span className="status-value">{statusText}</span>
            </div>
            <div className="status-row">
              <span className="status-label">Moves</span>
              <span className="status-value">{gameState.moveCount}</span>
            </div>
            <div className="status-row">
              <span className="status-label">Last Move</span>
              <span className="status-value">
                {gameState.lastMove
                  ? toLabel(gameState.lastMove[0], gameState.lastMove[1])
                  : "—"}
              </span>
            </div>
            <div className="status-row">
              <span className="status-label">Turn</span>
              <span className="status-value">{turnLabel}</span>
            </div>
            <div className="status-row">
              <span className="status-label">You Are</span>
              <span className="status-value">{roleLabel}</span>
            </div>
          </div>

          <div className="controls">
            <button className="primary" onClick={handleReset}>
              New Game
            </button>
            <button className="ghost" onClick={handleReset}>
              Reset Board
            </button>
          </div>

          <div className="tips">
            <h3>Tips</h3>
            <ul>
              <li>Stay in sync: wait for your turn before placing.</li>
              <li>Use the same room ID on both devices.</li>
              <li>
                Need a spectator? Share the room and keep the host online.
              </li>
            </ul>
          </div>
        </section>

        <section className="board-wrap">
          <div className="board">
            {gameState.board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const key = `${rowIndex}-${colIndex}`;
                const isStar = starPoints.has(key);
                const isLast =
                  gameState.lastMove?.[0] === rowIndex &&
                  gameState.lastMove?.[1] === colIndex;
                const isWinning = winningSet.has(key);
                const isBlocked = connection !== "connected" || !canPlay;
                return (
                  <button
                    key={key}
                    className={`cell${isStar ? " star" : ""}${
                      isLast ? " last" : ""
                    }${isWinning ? " win" : ""}${
                      isBlocked ? " blocked" : ""
                    }`}
                    onClick={() => handleMove(rowIndex, colIndex)}
                    aria-label={`Place at ${toLabel(rowIndex, colIndex)}`}
                  >
                    {cell !== EMPTY && (
                      <span
                        className={`stone ${cell === BLACK ? "black" : "white"}`}
                      />
                    )}
                  </button>
                );
              }),
            )}
          </div>
          <div className="legend">
            <span className="chip black">Black</span>
            <span className="chip white">White</span>
            <span className="chip hint">Star points</span>
          </div>
        </section>
      </main>
    </div>
  );
}
