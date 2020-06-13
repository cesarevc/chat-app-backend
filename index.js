const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();
const server = http.createServer(app);

const io = socketio(server);

app.use(cors());
app.use(router);

server.listen(PORT, () => console.log(`server has started on port`));


var MSGS = [];



io.on('connection', (socket) => {
    console.log('We have a new connection !!');

    socket.on('join', ({ name, room }, callback ) => {
        const { error, user } = addUser({ id: socket.id, name, room});
        
        if(error) return callback(error);

        // if not exist error then join user into room
        socket.join(user.room);


        socket.emit('initial-message', {user: 'admin', text: `${user.name}, welcome to the room ${user.room}`});
        socket.broadcast.to(user.room).emit('initial-message', {user: 'admin', text: `${user.name}, has joined!`});

        io.to(user.room).emit('room-data', { room: user.room, users: getUsersInRoom(user.room)})

        callback();
    });



    socket.on('new-message', (message, callback) => {

        const user = getUser(socket.id);      
        console.log(user)
        io.to(user.room).emit('new-message', {user: user.name, text: message});
        // io.emit('message', {user: user.name, text: message});
        

        // io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

        callback();
    });

    

    socket.on('disconnect', () => {
        console.log('User had left !!');
        const user = removeUser(socket.id);

        if(user) {
            io.to(user.room).emit('message', {user: 'admin', text: `${user.name} has left the room.`});
            io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
        }
    });
});

