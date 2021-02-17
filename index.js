const express = require('express')
const socketIo = require('socket.io')
const http = require('http')
const PORT = process.env.port || 5000
 
const router = require('./router')
const { 
  addUser, 
  removeUsers, 
  getUser, 
  getUsersInRoom 
} = require('./users')

const app = express()

app.use(router)

const server = http.createServer(app) 
const io = socketIo(server)

io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    console.log('user disconnect....!!')
  }) 

  socket.on('join', ({ name ,room }, callback) => {
    console.log({name, room,  sock : socket.id})
    
    const { error, user } = addUser({ id: socket.id, name, room })  
    
    if (error) return callback(error)

    socket.emit('message', { 
      user: 'admin', 
      text: `${user.name}, welcome to the room ${user.room}` 
    })

    socket.broadcast
      .to(user.room)
      .emit('message', `${user.name}, has joined the chat`)
    
    socket.join(user.room)
  
    io.to(user.room).emit('roomData' , {room: user.room, users : getUsersInRoom })
  })

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    
    io.to(user.room)
      .emit('message', { user: user.name, text : message})
    
    io.to(user.room)
      .emit('message', { room: user.room, text : message})



    callback()
  })

  socket.on('disconnect', () => {
    const user = removeUsers(socket.id)
     console.log({user})
    if (user) {
      io.to(user.room).emit('message' ,  { user: 'admin', text: `${user.name} left..`})
    }
  })
})

server.listen(PORT, () => 
  console.log('server has started on ..' + PORT)
)