var express = require('express');
var router = express.Router();
var {check,validationResult}=require('express-validator');
var bcrypt=require('bcryptjs');
const User = require('../models/user');
const passport = require('passport');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
router.get('/register', function(req, res, next) {
  res.render('register',{title:'Register'})
});
// kiem tra form
const checkFormRegister=[
  check('name','Name is reqired!').notEmpty(),
  check('email','Email is reqired!').isEmail(),
  check('username','Username is reqired!').notEmpty(),
  check('password','Password is reqired!').notEmpty(),
  check('password2').custom((value,{req})=>{
     if(value !== req.body.password){
       throw new Error('Password do not match!');
     }
     return true;
  })
]
router.post('/register',checkFormRegister,function(req,res,next){
  var name = req.body.name;
  var email=req.body.email;
  var username=req.body.username;
  var password=req.body.password;
  const errors = validationResult(req).errors;
  if(errors.length != 0){
    res.render('register',{errors,user:null,title:'Register'});
  }
  else{
    User.findOne({username:username},function(err,user){
      if(err) console.log(err);
      if(user){
        req.flash('danger','Username exists, choose another!')
        res.redirect('/users/register');
      }
      else{
        var user = new User({name,email,username,password,admin:0});
        bcrypt.genSalt(10,function(err,salt){
          if(err) console.log(err);
          bcrypt.hash(user.password,salt,function(err,hash){
            if(err)console.log(err);
            user.password=hash;
            user.save(function(err){
              if(err)console.log(err);
              else{
                req.flash('success','You are now registered!')
                res.redirect('/users/login');
              }
            })
          });
        });
      }
    });
  }
});
router.get('/login',function(req,res,next){
  if(res.locals.user) 
  res.redirect('/');
  res.render('login',{title:'Log in'});
})
router.post('/login',function(req,res,next){
  passport.authenticate('local',{
    successRedirect:'/',
    failureRedirect:'/users/login',
    failureFlash:true
  })(req,res,next);
});
router.get('/logout',function(req,res,next){
  if(res.locals.user) {
    req.logout();
    
    res.render('login',{title:'Log in'});
  }
  res.redirect('/');
})
module.exports = router;
