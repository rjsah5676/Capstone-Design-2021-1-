const express = require("express");
const router = express.Router();
const fs = require('fs')

const { v4: uuidV4 } = require('uuid');

const mongoose = require("mongoose");
const Room = require('../models/room');
const Account = require("../models/account");

const crypto = require("crypto");

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

/*
function forwardAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }

    res.redirect('/login')
}*/

//로그인에 성공할 시 serializeUser 메서드를 통해서 사용자 정보를 세션에 저장
passport.serializeUser(function (account, done) {
    done(null, account);
});

//사용자 인증 후 요청이 있을 때마다 호출
passport.deserializeUser(function (account, done) {
    done(null, account);
});

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true//request callback 여부
},
    function (req, email, password, done) {
        Account.findOne({ email: email, password: crypto.createHash('sha512').update(password).digest('base64') }, function (err, account) {
            if (err) {
                throw err;
            } else if (!account) {
                return done(null, false, req.flash('login_message', '이메일 또는 비밀번호를 확인하세요.')); // 로그인 실패
            } else {
                return done(null, account); // 로그인 성공
            }
        });
    }
));

/*
router.get('/', forwardAuthenticated, (req, res) => {
    console.log(req);
    res.render('home', {email: req.user.email});
})*/

router.get('/signup', (req, res) => {
    res.render("signup");
});

router.get("/login", (req, res) => res.render("login", { message: req.flash("login_message") }));

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/'); //로그아웃 후 '/'로 이동
});

router.post("/signup", (req, res, next) => {
    console.log(req.body);
    Account.find({ email: req.body.email })
        .exec()
        .then(accounts => {
            if (accounts.length >= 1) {
                res.send('<script type="text/javascript">alert("이미 존재하는 이메일입니다."); window.location="/signup"; </script>');
            } else {
                const account = new Account({
                    _id: new mongoose.Types.ObjectId(),
                    name: req.body.name,
                    email: req.body.email,
                    password: crypto.createHash("sha512").update(req.body.password).digest("base64")
                });
                account
                    .save()
                    .then(result => {
                        console.log(result);
                        res.redirect("/");
                    })
                    .catch(err => {
                        console.log(err);
                    });
            }
        });
});

// router.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), function (req, res) {
//     res.redirect('/', {email: (req == null ? "" : req.body.email)});
// });

router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

router.get('/newroom', (req, res) => {
    var newRoomId = uuidV4()
    const room = new Room({
        roomId: newRoomId,
    });
    room.save((err, room) => {
        if (err) return console.error(err);
    });
    res.redirect(`/${newRoomId}`)
})

router.get('/:room', async (req, res) => {
    const room = await Room.findOne({ roomId: req.params.room }, null, {})
    if (room !== null) res.render('room', { roomId: req.params.room })
    else {
        fs.readFile('views/noPage.ejs', async (err, tmpl) => {
            let html = tmpl.toString().replace('%', '회의실이 없습니다.')
            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.end(html)
        })
    }
})

router.post('/joinroom', (req, res) => {
    var tmp = req.body.address.split("/");
    console.log(tmp);
    if (tmp[2] == 'airboard.ga') {
        res.redirect(`/${tmp[3]}`);
    }
    else {
        res.render('noPage')
    }
})

router.get('/home/quit', async (req, res) => {
    fs.readFile('views/noPage.ejs', async (err, tmpl) => {
        let html = tmpl.toString().replace('%', '강제 퇴장 당하셨습니다.')
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(html)
    })
})

router.get('/controlUser/:room/:userId/:flag', async (req, res) => {
    var userId = req.params.userId
    var flag = req.params.flag
    var roomId = req.params.room
    if (flag === 'quit') {
        io.emit('quit', userId)
        await User.deleteOne({ userId: userId })
    }
    if (flag === 'cam') io.emit('cam', userId)
    if (flag === 'mute') io.emit('mute', userId)
    res.redirect('/userlist/' + roomId)
})

router.get('/address/:room', (req, res) => {
    res.render('address', { roomId: req.params.room })
})

router.get('/userlist/:room', (req, res) => {
    fs.readFile('views/userlist.ejs', async (err, tmpl) => {
        var roomId = req.params.room
        var userlist = await User.find({ roomId: roomId, isHost: false }, null, {})
        var cnt = 1
        var topText = "<li style=\"background-color:white; border:2px solid black; width: 600px;\"><h5"
            + " style = \"display:inline-block; width:150px; padding:0; margin:0;\">순번</h5>"
            + "<h5 style=\"display:inline-block; width:100px; padding:0; margin:0;\">이름</h5>"
        var userinfo = ""
        let html = tmpl.toString().replace('%', topText)
        if (userlist) {
            for (const user of userlist) {
                userinfo += "<li style=\"background-color:#a3a3a3; border:2px solid black;width: 600px;\"><h5 style ="
                    + " \"display:inline-block; width:150px; cursor:pointer; overflow: hidden; white-space:nowrap; text-overflow:ellipsis; padding:0; margin:0;\">"
                    + cnt++ + "</h5>" + "<h5 style=\"display:inline-block; width:100px; padding:0; margin:0;\">" + user.userName + "</h5>"
                    + "<button onclick='controlUser(" + "\"" + user.userId + "\"" + "," + "\"" + roomId + "\"" + "," + "\"" + "cam" + "\"" + ");'>캠 끄기</button>"
                    + "<button onclick='controlUser(" + "\"" + user.userId + "\"" + "," + "\"" + roomId + "\"" + "," + "\"" + "mute" + "\"" + ");'>마이크 끄기</button>"
                    + "<button onclick='controlUser(" + "\"" + user.userId + "\"" + "," + "\"" + roomId + "\"" + "," + "\"" + "quit" + "\"" + ");'>강제 퇴장</button>"
            }
        }
        html = html.toString().replace('|', userinfo)
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(html)
    })
})

router.get('/img/:fileName', (req, res) => {
    const { fileName } = req.params
    const { range } = req.headers
    const fileStat = fs.statSync('img/nocam.mp4')
    const { size } = fileStat
    const fullPath = 'img/nocam.mp4'
    if (range) {
        const parts = range.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0])
        const end = parts[1] ? parseInt(parts[1]) : size - 1
        const chunk = end - start + 1
        const stream = fs.createReadStream(fullPath, { start, end })
        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunk,
            'Content-Type': 'video/mp4'
        })
        stream.pipe(res)
    } else {
        res.writeHead(200, {
            'Content-Length': size,
            'Content-Type': 'video/mp4'
        })
        fs.createReadStream(fullPath).pipe(res)
    }
})

module.exports = router;