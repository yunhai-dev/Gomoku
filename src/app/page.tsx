"use client";

import { useMemo, useState } from "react";

const SIZE = 15;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

type Cell = 0 | 1 | 2;
type Board = Cell[][];

const createBoard = (): Board =>
  Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => EMPTY));

const starPoints = new Set(
  [
    [3, 3],
    [3, 11],
    [7, 7],
    [11, 3],
    [11, 11],
  ].map(([r, c]) => `${r}-${c}`),
);

const inBounds = (row: number, col: number) =>
  row >= 0 && row < SIZE && col >= 0 && col < SIZE;

const checkWin = (board: Board, row: number, col: number) => {
  const player = board[row][col];
  if (!player) return null;
  const directions = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];

  for (const [dr, dc] of directions) {
    const line: Array<[number, number]> = [[row, col]];
    let r = row + dr;
    let c = col + dc;
    while (inBounds(r, c) && board[r][c] === player) {
      line.push([r, c]);
      r += dr;
      c += dc;
    }
    r = row - dr;
    c = col - dc;
    while (inBounds(r, c) && board[r][c] === player) {
      line.unshift([r, c]);
      r -= dr;
      c -= dc;
    }
    if (line.length >= 5) {
      return { winner: player, line };
    }
  }

  return null;
};

const toLabel = (row: number, col: number) => {
  const letters = "ABCDEFGHIJKLMNO";
  return `${letters[col]}${row + 1}`;
};

export default function Home() {
  const [board, setBoard] = useState<Board>(createBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Cell>(BLACK);
  const [winner, setWinner] = useState<Cell>(EMPTY);
  const [winningLine, setWinningLine] = useState<Array<[number, number]>>([]);
  const [moveCount, setMoveCount] = useState(0);
  const [lastMove, setLastMove] = useState<[number, number] | null>(null);
  const [isDraw, setIsDraw] = useState(false);

  const winningSet = useMemo(() => {
    return new Set(winningLine.map(([r, c]) => `${r}-${c}`));
  }, [winningLine]);

  const statusText = useMemo(() => {
    if (winner === BLACK) return "Black wins!";
    if (winner === WHITE) return "White wins!";
    if (isDraw) return "Draw — the board is full.";
    return currentPlayer === BLACK ? "Black to move" : "White to move";
  }, [winner, isDraw, currentPlayer]);

  const handleReset = () => {
    setBoard(createBoard());
    setCurrentPlayer(BLACK);
    setWinner(EMPTY);
    setWinningLine([]);
    setMoveCount(0);
    setLastMove(null);
    setIsDraw(false);
  };

  const handleMove = (row: number, col: number) => {
    if (winner || isDraw) return;
    if (board[row][col] !== EMPTY) return;

    const nextBoard = board.map((line) => line.slice()) as Board;
    nextBoard[row][col] = currentPlayer;

    const result = checkWin(nextBoard, row, col);
    const nextMoveCount = moveCount + 1;

    setBoard(nextBoard);
    setLastMove([row, col]);
    setMoveCount(nextMoveCount);

    if (result) {
      setWinner(result.winner as Cell);
      setWinningLine(result.line);
      return;
    }

    if (nextMoveCount >= SIZE * SIZE) {
      setIsDraw(true);
      return;
    }

    setCurrentPlayer(currentPlayer === BLACK ? WHITE : BLACK);
  };

  return (
    <div className="app">
      <main className="stage">
        <section className="panel">
          <p className="eyebrow">Single-device Gomoku</p>
          <h1>Five in a Row</h1>
          <p className="subtitle">
            Place stones in turn. The first player to connect five in any
            direction wins.
          </p>
          <div className="status-card">
            <div className="status-row">
              <span className="status-label">Status</span>
              <span className="status-value">{statusText}</span>
            </div>
            <div className="status-row">
              <span className="status-label">Moves</span>
              <span className="status-value">{moveCount}</span>
            </div>
            <div className="status-row">
              <span className="status-label">Last Move</span>
              <span className="status-value">
                {lastMove ? toLabel(lastMove[0], lastMove[1]) : "—"}
              </span>
            </div>
            <div className="status-row">
              <span className="status-label">Next Player</span>
              <span className="status-value">
                {currentPlayer === BLACK ? "Black" : "White"}
              </span>
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
              <li>Open with central control to expand your threats.</li>
              <li>Create two lines at once to force responses.</li>
              <li>Block early — five in a row ends the game.</li>
            </ul>
          </div>
        </section>

        <section className="board-wrap">
          <div className="board">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const key = `${rowIndex}-${colIndex}`;
                const isStar = starPoints.has(key);
                const isLast =
                  lastMove?.[0] === rowIndex && lastMove?.[1] === colIndex;
                const isWinning = winningSet.has(key);
                return (
                  <button
                    key={key}
                    className={`cell${isStar ? " star" : ""}${
                      isLast ? " last" : ""
                    }${isWinning ? " win" : ""}`}
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
