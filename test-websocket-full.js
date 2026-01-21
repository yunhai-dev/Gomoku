const WebSocket = require('ws');

// 测试WebSocket游戏功能的完整流程
console.log('=== WebSocket游戏功能完整测试 ===\n');

// 测试客户端1（创建房间）
console.log('1. 客户端1：创建房间...');
const client1 = new WebSocket('ws://localhost:3001');
let roomId = 'TEST' + Math.floor(Math.random() * 10000);

client1.on('open', () => {
  console.log('   ✓ 客户端1：WebSocket连接已建立');
  client1.send(JSON.stringify({ type: 'join', roomId }));
});

client1.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('   客户端1收到：', message.type);
  
  if (message.type === 'welcome') {
    console.log('   ✓ 客户端1：成功加入房间', roomId);
    console.log('   ✓ 客户端1角色：', message.role);
    
    // 客户端1加入成功后，创建客户端2
    setTimeout(() => {
      console.log('\n2. 客户端2：加入同一房间...');
      const client2 = new WebSocket('ws://localhost:3001');
      
      client2.on('open', () => {
        console.log('   ✓ 客户端2：WebSocket连接已建立');
        client2.send(JSON.stringify({ type: 'join', roomId }));
      });
      
      client2.on('message', (data) => {
        const message = JSON.parse(data.toString());
        console.log('   客户端2收到：', message.type);
        
        if (message.type === 'welcome') {
          console.log('   ✓ 客户端2：成功加入房间', roomId);
          console.log('   ✓ 客户端2角色：', message.role);
          
          // 客户端2加入成功后，客户端1发送移动
          setTimeout(() => {
            console.log('\n3. 客户端1：发送棋子移动（3,3）...');
            client1.send(JSON.stringify({ type: 'move', row: 3, col: 3 }));
          }, 500);
        } else if (message.type === 'state') {
          // 检查是否收到移动更新
          if (message.state.board[3][3] === 1) {
            console.log('   ✓ 客户端2：成功收到移动更新，棋子已放置在（3,3）');
            console.log('   ✓ 当前回合：', message.state.currentPlayer === 1 ? '黑方' : '白方');
            
            // 客户端2发送移动
            setTimeout(() => {
              console.log('\n4. 客户端2：发送棋子移动（4,4）...');
              client2.send(JSON.stringify({ type: 'move', row: 4, col: 4 }));
            }, 500);
          } else if (message.state.board[4][4] === 2) {
            console.log('   ✓ 客户端2：成功收到自己的移动更新，棋子已放置在（4,4）');
            
            // 所有测试完成，关闭连接
            setTimeout(() => {
              console.log('\n=== 测试完成 ===');
              console.log('✓ WebSocket连接正常');
              console.log('✓ 房间创建和加入正常');
              console.log('✓ 游戏状态同步正常');
              console.log('✓ 多客户端消息广播正常');
              
              client1.close();
              client2.close();
            }, 500);
          }
        }
      });
      
      client2.on('error', (error) => {
        console.error('   ✗ 客户端2：WebSocket错误:', error);
      });
      
      client2.on('close', () => {
        console.log('   客户端2：WebSocket连接已关闭');
      });
    }, 1000);
  } else if (message.type === 'state') {
    // 检查是否收到移动更新
    if (message.state.board[3][3] === 1) {
      console.log('   ✓ 客户端1：成功收到移动更新，棋子已放置在（3,3）');
    } else if (message.state.board[4][4] === 2) {
      console.log('   ✓ 客户端1：成功收到客户端2的移动更新，棋子已放置在（4,4）');
    }
  }
});

client1.on('error', (error) => {
  console.error('   ✗ 客户端1：WebSocket错误:', error);
});

client1.on('close', () => {
  console.log('   客户端1：WebSocket连接已关闭');
});
