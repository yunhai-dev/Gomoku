import React, { useState } from 'react';
import Board from './components/Board';
import styled from 'styled-components';

const Container = styled.div`
  text-align: center;
  font-family: Arial, sans-serif;
`;

const Status = styled.p`
  font-size: 18px;
  margin: 20px 0;
`;

const ResetButton = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
`;

function App() {
  const BOARD_SIZE = 15;
  const initializeBoard = () => Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null));
  
  const [board, setBoard] = useState(initializeBoard);
  const [currentPlayer, setCurrentPlayer] = useState('black');
  const [winner, setWinner] = useState(null);

  const checkWinner = (board, row, col) => {
    const directions = [
      [0, 1], // horizontal
      [1, 0], // vertical
      [1, 1], // diagonal \
      [1, -1] // diagonal /
    ];
    const player = board[row][col];
    for (const [dr, dc] of directions) {
      let count = 1;
      // Check positive direction
      let r = row + dr;
      let c = col + dc;
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
        count++;
        r += dr;
        c += dc;
      }
      // Check negative direction
      r = row - dr;
      c = col - dc;
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
        count++;
        r -= dr;
        c -= dc;
      }
      if (count >= 5) return player;
    }
    return null;
  };

  const handleSquareClick = (index) => {
    if (winner) return;
    const row = Math.floor(index / BOARD_SIZE);
    const col = index % BOARD_SIZE;
    if (board[row][col]) return; // Cell occupied
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);
    const win = checkWinner(newBoard, row, col);
    if (win) {
      setWinner(win);
    } else {
      setCurrentPlayer(currentPlayer === 'black' ? 'white' : 'black');
    }
  };

  const resetGame = () => {
    setBoard(initializeBoard);
    setCurrentPlayer('black');
    setWinner(null);
  };

  return (
    <Container>
      <h1>五子棋游戏</h1>
      <Status>
        {winner ? `获胜者: ${winner === 'black' ? '●' : '○'}` : `当前玩家: ${currentPlayer === 'black' ? '●' : '○'}`}
      </Status>
      <Board board={board} onSquareClick={handleSquareClick} />
      <br />
      <ResetButton onClick={resetGame}>重置游戏</ResetButton>
    </Container>
  );
}

export default App;
