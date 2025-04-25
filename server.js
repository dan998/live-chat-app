const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

app.get('/myip', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  res.send({ ip });
});

app.get('/:room', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  socket.on('join-room', ({ room, username }) => {
    socket.join(room);
    socket.username = username || 'Guest';
    socket.room = room;
    socket.to(room).emit('chat message', `${socket.username} joined the room.`);
  });

  socket.on('chat message', (msg) => {
    io.to(socket.room).emit('chat message', `${socket.username}: ${msg}`);
  });

  socket.on('disconnect', () => {
    if (socket.room) {
      socket.to(socket.room).emit('chat message', `${socket.username} left the room.`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
