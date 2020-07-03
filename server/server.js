const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const socket = require('socket.io');
const io = socket(server);

const rooms = {};

io.on('connection', (socket) => {
  //check for uniqueness in username
  socket.on('check user', (roomData) => {
    const { roomID, name } = roomData;
    let present = false;
    if (rooms[roomID]) {
      if (rooms[roomID].some((item) => item.username === name)) {
        present = true;
      }
    }
    io.to(socket.id).emit('check user result', present);
  });

  socket.on('join room', (roomData) => {
    const { roomID, name } = roomData;
    if (rooms[roomID] && rooms[roomID] !== undefined) {
      if (rooms[roomID].length !== 0) {
        if (!rooms[roomID].includes(socket.id)) {
          rooms[roomID].push({
            id: socket.id,
            type: 'partner',
            username: name,
          });
        }
        //find the initiator and emit to that socket id
        const initiator = rooms[roomID].find(
          (item) => item.type === 'initiator'
        );
        if (initiator !== undefined)
          io.to(initiator.id).emit('create connection', socket.id);

        if (rooms[roomID].length > 2) {
          rooms[roomID].map((user) => {
            if (user.type !== 'initiator' && user.id !== socket.id) {
              io.to(socket.id).emit('create connection', user.id);
            }
          });
        }
      } else {
        rooms[roomID].push({
          id: socket.id,
          type: 'initiator',
          username: name,
        });
      }
    } else {
      rooms[roomID] = [{ id: socket.id, type: 'initiator', username: name }];
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
  socket.on('closing', (data) => {
    const { id, roomID } = data;
    if (rooms[roomID]) {
      const leaving_peer = rooms[roomID].find((item) => item.id === id);
      if (leaving_peer !== undefined) {
        rooms[roomID] = rooms[roomID].filter((item) => item.id !== id);
        if (leaving_peer.type === 'initiator' && rooms[roomID].length !== 0) {
          rooms[roomID][0].type = 'initiator';
        }
      }
    }
  });
});

server.listen(process.env.PORT || 8000, () =>
  console.log('server is running on port 8000')
);
