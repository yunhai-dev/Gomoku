import React from 'react';
import styled from 'styled-components';

const SquareButton = styled.button`
  width: 30px;
  height: 30px;
  border: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

function Square({ value, onClick }) {
  return (
    <SquareButton onClick={onClick}>
      {value === 'black' ? '●' : value === 'white' ? '○' : ''}
    </SquareButton>
  );
}

export default Square;