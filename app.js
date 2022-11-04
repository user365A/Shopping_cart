var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session=require("express-session");
var fileupload=require("express-fileupload");
var passport=require('passport');

var indexRouter = require('./routes/pages');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin_pages');
var categoriesRouter=require('./routes/admin_categories');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret:'keyboard cat',
  resave:true,
  saveUninitialized:true
}))
app.use(require('connect-flash')());
app.use(function(req,res,next){
  res.locals.messages=require('express-messages')(req,res);
  next();
});
app.use(fileupload());

app.use('/products',require('./routes/products'));
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin/pages',adminRouter);
app.use('/admin/categories',categoriesRouter)
app.use('/admin/products',require('./routes/admin_products.js'))
app.use('/cart',require('./routes/cart'))
// app.use('/user',require('./routes/users'));
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
//ket noi mongoose
const mongoose=require("mongoose")
const config=require("./config/database")
mongoose.connect(config.database,{
    useNewUrlParser:true,
    useUnifiedTopology:true,
});

//khai bao app.locals.errors
app.locals.errors=null;

const db=mongoose.connection;
db.on("error",console.error.bind(console,"connect error:"));
db.once('open',function(){
    console.log("Ket noi thanh cong");
});
// get page model
var Page=require('./models/page');
//lay het page truyen vo header
Page.find(function(err,pages){
  if(err) console.log(err);
  else{
    app.locals.pages=pages;
  }
});
// get Category model
var Category=require('./models/category');
//lay het category truyen vo header
Category.find(function(err,categories){
  if(err) console.log(err);
  else{
    app.locals.categories=categories;
  }
});
// passport
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());
//cart session
app.get('*',function(req,res,next){
  res.locals.cart=req.session.cart;
  res.locals.user=req.user || null;
  next();
})
module.exports = app;
