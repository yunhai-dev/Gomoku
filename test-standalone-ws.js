const WebSocket = require('ws');

console.log('测试独立WebSocket服务器连接...');

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('✓ WebSocket连接成功建立');
  
  // 发送加入房间请求
  ws.send(JSON.stringify({
    type: 'join',
    roomId: 'TEST123'
  }));
  
  // 发送移动请求
  setTimeout(() => {
    console.log('发送移动请求...');
    ws.send(JSON.stringify({
      type: 'move',
      row: 3,
      col: 3
    }));
  }, 500);
  
  // 1秒后关闭连接
  setTimeout(() => {
    console.log('正在关闭连接...');
    ws.close();
  }, 1000);
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('收到服务器消息:', message.type);
  
  if (message.type === 'welcome') {
    console.log('✓ 成功加入房间');
    console.log('角色:', message.role);
  } else if (message.type === 'state') {
    console.log('✓ 收到游戏状态更新');
  }
});

ws.on('error', (error) => {
  console.log('✗ WebSocket连接错误:', error.message);
});

ws.on('close', (code, reason) => {
  console.log('WebSocket连接已关闭，代码:', code, '原因:', reason.toString());
});