// 测试WebSocket连接的脚本
const WebSocket = require('ws');

// 连接到WebSocket服务器
const ws = new WebSocket('ws://localhost:3000/api/socket');

ws.on('open', () => {
  console.log('WebSocket连接已建立');
  
  // 发送加入房间的消息
  ws.send(JSON.stringify({ type: 'join', roomId: 'TEST123' }));
});

ws.on('message', (data) => {
  console.log('收到服务器消息:', JSON.parse(data));
});

ws.on('error', (error) => {
  console.error('WebSocket错误:', error);
});

ws.on('close', () => {
  console.log('WebSocket连接已关闭');
});

// 5秒后关闭连接
setTimeout(() => {
  ws.close();
}, 5000);