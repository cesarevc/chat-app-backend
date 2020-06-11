const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {
    // console.log('We have a new connection !!');

    socket.on('join', ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room});
        
        if(error) return callback(error);

        socket.emit('message', {user: 'admin', text: `${user.name}, welcome to the room ${user.room}`});
        socket. broadcast.to(user.room).emit('message', {user: 'admin', text: `${user.name}, has joined!`});
        // if not exist error then join user into room
        socket.join(user.room);

        callback();
    });


    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.io);

        io.to(user.room).emmit('message', { user: user.name, text: message });

        callback();
    });
    

    socket.on('disconnect', () => {
        console.log('User had left !!');
    });
});

app.use(router);

server.listen(PORT, () => console.log(`server has started on port ${PORT}`));