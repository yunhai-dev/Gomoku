const http = require('http');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;

// 游戏常量
const SIZE = 15;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

// 游戏状态类型
class GameState {
  constructor() {
    this.board = this.createBoard();
    this.currentPlayer = BLACK;
    this.winner = EMPTY;
    this.winningLine = [];
    this.moveCount = 0;
    this.lastMove = null;
    this.isDraw = false;
  }
  
  createBoard() {
    return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => EMPTY));
  }
  
  reset() {
    this.board = this.createBoard();
    this.currentPlayer = BLACK;
    this.winner = EMPTY;
    this.winningLine = [];
    this.moveCount = 0;
    this.lastMove = null;
    this.isDraw = false;
  }
}

// 房间类型
class Room {
  constructor(id) {
    this.id = id;
    this.state = new GameState();
    this.clients = new Set();
    this.players = { black: null, white: null };
  }
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  // 设置CORS头
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*'
  });
  res.end('WebSocket Server Running\n');
});

// 创建WebSocket服务器
const wss = new WebSocketServer({ server });

// 房间管理
const rooms = new Map();

// 检查边界
function inBounds(row, col) {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

// 检查胜利
function checkWin(board, row, col) {
  const player = board[row][col];
  if (!player) return null;
  
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
  
  for (const [dr, dc] of directions) {
    const line = [[row, col]];
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
}

// 发送消息
function send(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

// 获取房间
function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Room(roomId));
  }
  return rooms.get(roomId);
}

// 获取房间玩家状态
function roomPlayers(room) {
  return {
    black: Boolean(room.players.black),
    white: Boolean(room.players.white)
  };
}

// 广播房间状态给所有客户端
function broadcastState(room) {
  for (const client of room.clients) {
    send(client, {
      type: "state",
      state: room.state,
      role: client.role || "spectator",
      players: roomPlayers(room)
    });
  }
}

// 处理WebSocket连接
wss.on('connection', (ws, req) => {
  console.log(`WebSocket connection from ${req.socket.remoteAddress}:${req.socket.remotePort}`);
  
  // 初始角色
  ws.role = "spectator";
  ws.roomId = null;
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`Received message: ${message.type} from ${req.socket.remoteAddress}`);
      
      // 处理加入房间请求
      if (message.type === "join") {
        const roomId = String(message.roomId || "").trim();
        if (!roomId) return;
        
        const room = getRoom(roomId);
        room.clients.add(ws);
        ws.roomId = roomId;
        
        // 分配角色
        if (!room.players.black) {
          room.players.black = ws;
          ws.role = "black";
        } else if (!room.players.white) {
          room.players.white = ws;
          ws.role = "white";
        }
        
        // 发送欢迎消息
        send(ws, {
          type: "welcome",
          role: ws.role,
          roomId,
          players: roomPlayers(room),
        });
        
        // 广播房间状态
        broadcastState(room);
        return;
      }
      
      // 处理游戏操作
      if (!ws.roomId) return;
      const room = rooms.get(ws.roomId);
      if (!room) return;
      
      // 处理重置游戏请求
      if (message.type === "reset") {
        room.state.reset();
        broadcastState(room);
        return;
      }
      
      // 处理落子请求
      if (message.type === "move") {
        const { row, col } = message;
        
        // 检查边界和是否为空
        if (!inBounds(row, col) || room.state.board[row][col] !== EMPTY) return;
        
        // 检查是否有赢家
        if (room.state.winner) return;
        
        // 检查是否是当前玩家的回合
        const playerColor = ws.role === "black" ? BLACK : WHITE;
        if (room.state.currentPlayer !== playerColor) return;
        
        // 落子
        room.state.board[row][col] = playerColor;
        room.state.lastMove = [row, col];
        room.state.moveCount += 1;
        
        // 检查胜利
        const result = checkWin(room.state.board, row, col);
        if (result) {
          room.state.winner = result.winner;
          room.state.winningLine = result.line;
        } else {
          // 切换玩家
          room.state.currentPlayer = room.state.currentPlayer === BLACK ? WHITE : BLACK;
        }
        
        // 广播更新后的状态
        broadcastState(room);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log(`WebSocket connection closed from ${req.socket.remoteAddress}`);
    
    // 清理客户端
    if (ws.roomId) {
      const room = rooms.get(ws.roomId);
      if (room) {
        room.clients.delete(ws);
        
        // 移除玩家
        if (room.players.black === ws) {
          room.players.black = null;
        } else if (room.players.white === ws) {
          room.players.white = null;
        }
        
        // 如果房间为空，删除房间
        if (room.clients.size === 0) {
          rooms.delete(ws.roomId);
          console.log(`Room ${ws.roomId} deleted (empty)`);
        } else {
          // 广播房间状态更新
          broadcastState(room);
        }
      }
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// 启动服务器
const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=== Standalone WebSocket Server ===`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`Available on LAN: ws://0.0.0.0:${PORT}`);
  console.log(`==================================\n`);
});

