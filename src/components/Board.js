import React from 'react';
import Square from './Square';
import styled from 'styled-components';

const BoardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(15, 30px);
  gap: 0;
  margin: 0 auto;
  width: fit-content;
`;

function Board({ board, onSquareClick }) {
  return (
    <BoardContainer>
      {board.flat().map((value, index) => (
        <Square
          key={index}
          value={value}
          onClick={() => onSquareClick(index)}
        />
      ))}
    </BoardContainer>
  );
}

export default Board;