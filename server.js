const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.render('home');
})

app.get('/newroom', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
  socket.on('sendMessage', function(data){ data.name = socket.userName; io.sockets.emit('updateMessage', data); });

  socket.on('join-room', (roomId, userId, userName) => {
    socket.userName=userName

    var msg= userName + '님이 접속하셨습니다.'
    socket.emit('updateMessage', { name : 'SERVER', message : msg });

    socket.join(roomId)
    socket.to(roomId).broadcast.emit('user-connected', userId)

    socket.on('disconnect', () => {
      var exit_msg = userName + '님이 퇴장하셨습니다.'
      socket.emit('updateMessage', { name : 'SERVER', message : exit_msg });
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })
  })
})

server.listen(3000)