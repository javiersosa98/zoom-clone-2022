const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidv4 } = require('uuid');
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, { 
    debug: true
});
let nicknames = []; // contains the names of the users

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use('/peerjs', peerServer);

app.get('/', (req, res) => {
    res.redirect(`/${uuidv4()}`);
})

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room });
})

// server-side socket
io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.broadcast.to(roomId).emit('user-connected', userId);
        // message
        socket.on('message', message => {
            // send message to the same room
            io.to(roomId).emit('createMessage', { 
                msg: message,
                nick: socket.nickname
            });
        });

        socket.on('new-user', (data, cb) => {
            if (data == ""){
                cb({ok: false, msg: "Username cannot be empty."});
            } else if (nicknames.indexOf(data) != -1) {
                cb({ok: false, msg: "That username already exists."});
            } else {
                cb({ok: true, msg: "Successful login."});
                socket.nickname = data;
                nicknames.push(socket.nickname);
            }
        });

    });

    socket.on('disconnect', () => {
        if (!socket.nickname) return;
        nicknames.splice(nicknames.indexOf(socket.nickname), 1);
        socket.broadcast.to(roomId).emit('user-disconnected', userId);
    });
})


server.listen(process.env.PORT||3030);