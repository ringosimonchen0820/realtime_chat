// import express library 
// setup server port
const express = require('express');
const app = express();
const server = require('http').Server(app);
const port = 3030;

// import socket.io library
const io = require('socket.io')(server);

// import peer.js library
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true
});

// setup ejs as template engine 
app.set('view engine', 'ejs');

// import uuid for generating unique id for each conference room
const { v4: uuidv4 } = require('uuid'); 

// setup root directories
const path = require('path');
const serveStatic = require('serve-static');
app.use(serveStatic(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
    res.redirect(`/${uuidv4()}`); 
}); 

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room });
});

// create a socket io server
io.on('connection', socket => {
    // your socket listen to the room and the user within
    socket.on('join-room', (roomId, userId) => { 
        // your socket join the room
        socket.join(roomId);
        // socket broadcast the connected user inside the room
        socket.to(roomId).emit('user-connected', userId);
        
        // socket listen to the message from the client side with different user and them emit back to client side
        socket.on('message', message => {
            io.to(roomId).emit('createMessage', message)
        }) 
    })
});

// create peerjs server
app.use('/peerjs', peerServer);


server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
});
