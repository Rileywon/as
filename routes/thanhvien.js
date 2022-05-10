var express = require('express');
var router = express.Router();
var db = require('../models/database');
const nodemailer = require("nodemailer");
var sessionAgent;
const useragent = require('express-useragent');
router.use(useragent.express());

router.use(function (req, res, next) {
    if (!req.session.useragent) {
        let userAgentIs = (useragent) => {
            let r = [];
            for (let i in useragent)
                if (useragent[i] === true)
                    r.push(i);
            return r;
        }
        req.session.useragent = {
            browser: req.useragent.browser,
            version: req.useragent.version,
            os: req.useragent.os,
            platform: req.useragent.platform,
            geoIp: req.useragent.geoIp, // needs support from nginx proxy
            source: req.useragent.source,
            is: userAgentIs(req.useragent),
        };
        sessionAgent = req.session.useragent
    }
    return next();
});
//const formidableMiddleware = require("express-formidable");
require("dotenv").config();
/*router.use(
    formidableMiddleware({
        multiples: true
    })
);
*/
var messageCustom = '';
module.exports = router;
router.get('/dangky', function (req, res) {
    res.render("dangky.ejs", { mess: messageCustom });
});
router.post('/luu', function (req, res) {
    let u = req.body.username;
    let p = req.body.password;
    if ((!p || p.length < 8) || (u.length == 0)) {
        messageCustom = 'Mật khẩu buộc phải có ít nhất 8 ký tự, bao gồm chữ cái, chữ cái in hoa và số';
        res.redirect("/thanhvien/dangky");
    }
    else {
        const bcrypt = require("bcrypt");
        var salt = bcrypt.genSaltSync(10);
        var pass_mahoa = bcrypt.hashSync(p, salt);
        let user_info = { username: u, password: pass_mahoa };
        let sql = 'INSERT INTO users SET ?';
        db.query(sql, user_info);
        res.redirect("/thanhvien/camon");
    }
})
router.get('/dangnhap', function (req, res) {
    if (!req.session.username) {
        res.render("dangnhap.ejs", { mess: messageCustom });
    } else {
        res.redirect("/thanhvien/download");
    }
});

router.post('/dangnhap', function (req, res) {
    let un = req.body.username;
    let pn = req.body.password;
    let sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [un], (err, rows) => {
        if (rows.length <= 0) { res.redirect("/thanhvien/dangnhap"); return; }
        let user = rows[0];
        let pass_fromdb = user.password;
        const bcrypt = require("bcrypt");
        var kq = bcrypt.compareSync(pn, pass_fromdb);
        if (kq) {
            var sess = req.session;
            sess.daDangNhap = true;
            sess.username = user.username;
            if (sess.back) {
                res.redirect(sess.back);
            }
            else {
                let addip = { browser: sessionAgent.browser, version: sessionAgent.version, os: sessionAgent.os, platform: sessionAgent.platform, geoIp: sessionAgent.geoIp, source: sessionAgent.source, is: sessionAgent.is };
                let sql = "INSERT INTO `manager` (`manager_id`,`userid`, `browser`, `version`, `os`, `platform`, `geoIp`, `source`, `is`) VALUES (NULL, '" + user.userid + "', '" + sessionAgent.browser + "', '" + sessionAgent.version + "', '" + sessionAgent.os + "','" + sessionAgent.platform + "', '" + JSON.stringify(sessionAgent.geoIp) + "', '" + sessionAgent.source + "', '" + sessionAgent.is + "')";
                db.query(sql);
                console.log(addip)
                res.redirect("/thanhvien/download");
            }
        }
        else {
            messageCustom = 'sai tk hoac mk';
            res.redirect("/thanhvien/dangnhap");
        }

    });
});

router.get('/download', function (req, res) {
    res.render("download.ejs");
});
router.get('/download', function (req, res) {
    if (req.session.daDangNhap) {

        res.render("download.ejs", { un: req.session.username });
    }
    else {
        req.session.back = "/thanhvien/download";
        res.redirect("/thanhvien/dangnhap");
    }
});
router.get('/thoat', function (req, res) {
    req.session.destroy()
    res.redirect("/")
});
router.get('/camon', function (req, res) {
    res.render("camon.ejs")
});

router.get('/quenmk', function (req, res) {
    res.render("quenmk.ejs", { messQmk: messageCustom });
});
router.post('/quenmk', function (req, res) {
    let un = req.body.username;
    var pn = req.body.password;
    let sql = 'SELECT * FROM users WHERE username = ?'
    db.query(sql, [un], (err, rows) => {
        if (rows.length > 0) {
            var saltRounds = "Thang19999";
            const bcrypt = require("bcrypt");
            bcrypt.hash(saltRounds, 5, function (err, hash) {
                db.query(' UPDATE `users` SET `password` = "' + hash + '" WHERE `users`.`email` = "' + rows[0].email + '"');
            });
            messageCustom = 'Thanh Cong,mat khau dua ve mac dinh "Thang19999"';
            res.redirect('/thanhvien/quenmk')
        }
        else {
            messageCustom = 'sai email';
            res.redirect("/thanhvien/quenmk");
        }
    })
});
router.get('/guimail', function (req, res) {
    res.render("index.pug")
});

router.post('/guimail', function (req, res) {
    var attachments; //Khởi tạo biến chứa các attachments

    //Khởi tạo đối tượng để gửi mail
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: process.env.PORTGMAIL,
        secure: true,
        service: "Gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        }
    });
    if (req.files.fileSend.length > 0) {
        attachments = db.req.files.fileSend.map(file => {
            return {
                filename: file.name,
                path: file.path
            };
        });
    }
    if (req.files.fileSend.size > 0) {
        attachments = [
            {
                filename: req.files.fileSend.name,
                path: req.files.fileSend.path
            }
        ];
    }
    let { to, subject, text } = req.fields;
    let mailOptions = {
        from: process.env.EMAIL,
        to,
        subject: 'Email thay đổi mật khẩu',
        text: '0503',
        attachments
    };
    const sendMail = new Promise(function (resolve, reject) {
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                reject({
                });
            } else {
                resolve({
                });
            }
        });
    });
    sendMail
        .then(result => {
            res.render("index", result);
        })
        .catch(err => {
            res.render("index", err);
        });
    transporter.close();
});
router.get('/quanly', function (req, res) {
   let sql = 'SELECT * FROM `manager`';
  //   let sql = 'SELECT * FROM `manager` WHERE `userid`= ?'
    db.query(sql, function (err, data) {
        if (err) throw err;
        res.render("quanly.hbs", { all: data });
        console.log({ all: data })
        console.log(req.session.username);
    })
});
router.post('/dangxuat', function (req, res) {

});

