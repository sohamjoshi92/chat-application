const express = require('express')
const http = require('http')
const path = require('path')
const socketio  = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUserRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)//socket io requires a raw http server to be passed in.

const public_dir = path.join(__dirname,'../public')
const port = process.env.PORT || 3000

app.use(express.static(public_dir))


io.on('connection', (socket) => { //default
    console.log('new connection')
    
    socket.on('join', ({ username, room }, callback) => {
        const { error, user } =addUser({ id : socket.id, username, room })
        if(error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage('Admin', 'WELCOME !'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`))
        io.to(user.room).emit('roomData', {
            room : user.room,
            users : getUserRoom(user.room)
        })
        callback()
    })
    socket.on('messageSent', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity not allowed')
        }
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })
    socket.on('sentLocation', (location, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('location', generateLocationMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback()
    })
    socket.on('disconnect', () => { //default
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room : user.room,
                users : getUserRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log('Serving up on port '+port)
})