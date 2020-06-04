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

      if (rooms[roomID].length > 2) {
        rooms[roomID].map((user) => {
          if (user.type !== 'initiator' && user.id !== socket.id) {
            io.to(socket.id).emit('create connection', user.id);
          }
        });
      }
    } else {
      rooms[roomID] = [{ id: socket.id, type: 'initiator' }];
      io.to(socket.id).emit('initiator check', socket.id);
    }
  });

  socket.on('call partner', (incoming) => {
    const payload = incoming;
    io.to(incoming.partnerID).emit('caller signal', payload);
  });

  socket.on('accept call', (incoming) => {
    io.to(incoming.callerID).emit('callee signal', incoming);
  });
  socket.on('closing', (id) => {
    console.log(id);
  });
});

server.listen(process.env.PORT || 8000, () =>
  console.log('server is running on port 8000')
);
