const WebSocket = require('ws');

console.log('正在测试WebSocket连接...');

const ws = new WebSocket('ws://localhost:3000/api/socket');

ws.on('open', () => {
  console.log('✓ WebSocket连接成功建立');
  
  // 发送加入房间请求
  ws.send(JSON.stringify({
    type: 'join',
    roomId: 'TEST123'
  }));
  
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
  console.log('错误详情:', error);
});

ws.on('close', (code, reason) => {
  console.log('WebSocket连接已关闭，代码:', code, '原因:', reason);
});