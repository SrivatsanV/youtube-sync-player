const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const socket = require('socket.io');
const io = socket(server);

const rooms = {};

io.on('connection', (socket) => {
  socket.on('join room', (roomID) => {
    if (rooms[roomID]) {
      if (!rooms[roomID].includes(socket.id)) {
        rooms[roomID].push({ id: socket.id, type: 'partner' });
      }
      //find the initiator and emit to that socket id
      const initiator = rooms[roomID].find((item) => item.type === 'initiator');
      io.to(initiator.id).emit('create connection', socket.id);
    } else {
      rooms[roomID] = [{ id: socket.id, type: 'initiator' }];
    }
  });

  socket.on('call partner', (incoming) => {
    const payload = {
      callerID: incoming.callerID,
      signal: incoming.signal,
    };
    io.to(incoming.partnerID).emit('caller signal', payload);
  });

  socket.on('accept call', (incoming) => {
    io.to(incoming.callerID).emit('callee signal', incoming.signal);
  });
});

server.listen(process.env.PORT || 8000, () =>
  console.log('server is running on port 8000')
);
