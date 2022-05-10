const express = require('express')
const app = express()
const ejs = require('ejs')
const hbs = require('hbs')
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs');
app.set('view engine', 'hbs');
var flush = require('connect-flash')
const formidable = require('formidable')

const nodemailer = require("nodemailer");
const formidableMiddleware = require("express-formidable");
require("dotenv").config();

app.engine('ejs', require('ejs').__express);
app.set("view engine", "pug");
app.engine('pug', require('pug').__express);
app.engine('hbs', require('hbs').__express);
var session = require('express-session');
app.use(session({
  secret: 'abcdefg',
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}));
app.use(flush());
var tvRouter = require('./routes/thanhvien');
app.use('/thanhvien', tvRouter);
app.get('/', function (req, res) {
  res.redirect('/thanhvien/dangnhap');
});
app.use(
  formidableMiddleware({
    multiples: true
  })
);
const PORT = process.env.PORT || 3000;

app.listen(PORT);