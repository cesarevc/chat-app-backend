const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(cors());
app.use(router);

// RUNS WHEN CLIENT CONNECTS
io.on('connect', (socket) => {
  
  // LISTEN WHEN A USER JOINS
  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if(error) return callback(error);

    // if not exist error then join user into room
    socket.join(user.room);

    // initial messages
    // welcome message exclusive to new user
    socket.emit(
      'message',
      { user: 'Admin', text: `${user.name}, welcome to room ${user.room}.`}
    );

    // Broadcast when new user connects
    // message to their other members into room except new user
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        { user: 'Admin', text: `${user.name} has joined!` }
      );
        
    // Send users and room info
    io.to(user.room).emit('roomData', { 
      room: user.room,
      users: getUsersInRoom(user.room) 
    });

    callback();

  });


  // LISTEN NEW MESSAGES
  socket.on('send-message', (message, callback) => {

    const user = getUser(socket.id);
    io.to(user.room).emit('message', { 
      user: user.name,
      text: message 
    });

    callback();

  });

  // LISTEN WHEN CLIENT DISCONNECTS
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if(user) {
      // message to their members into room
      io.to(user.room).emit(
        'message',
        { user: 'Admin', text: `${user.name} has left.` }
      );

      // Send users and room info
      io.to(user.room).emit('roomData', { 
        room: user.room, 
        users: getUsersInRoom(user.room)
      });
    }
  });

});

server.listen(process.env.PORT || 5000, () => console.log(`Server has started.`));