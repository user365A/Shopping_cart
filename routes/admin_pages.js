const { log } = require('debug/src/browser');
const Page = require('../models/page');
var express = require('express');
var router = express.Router();
var {check,validationResult}=require('express-validator');
/* GET home page. */
router.get('/', function(req, res, next) {
  Page.find({}).exec(function(err,pages){
    res.render('admin/pages',{ pages });
  });
});
//add page
router.get('/add_page', function(req, res, next) {
    var title="";
    var slug="";
    var content="";
    res.render('admin/add_page',{title,slug,content});
  });
router.post("/add_page",[
    check('title','Title must have a value').notEmpty(),
    check('content','Content must have a value').notEmpty()
],
function(req,res,next){
    var title =req.body.title;
    var slug=req.body.slug.replace(/\s+/g,'-').toLowerCase();
    if(slug=="")
    {
        slug=title.replace(/\s+/g,'-').toLowerCase();
    }
    var content =req.body.content;
    const errors=validationResult(req).errors;
    if(errors.length != 0)
    {
        res.render('admin/add_page',{errors,title,slug,content});
    }
    else {
        console.log('Chuyen du lieu tu form vao database');
        Page.findOne({slug:slug},function (err,page)
        {
            if(page){
                req.flash('danger','Page slug exists, choose another.');
                res.render('admin/add_page',{title,slug,content});
            }
            else {
                var page = new Page({title,slug,content,sorting:100});
                page.save(function(err){
                    if(err)
                    return console.log(err);
                    Page.find(function(err,pages){
                        if(err) console.log(err);
                        else{
                          req.app.locals.pages=pages;
                        }
                      });
                    req.flash('success','Page added');
                    res.redirect('/admin/pages');
                });
            }
        });
    }
    
})
router.get('/edit_page/:id', function(req, res, next) {
    Page.findOne({"_id":req.params.id},function(err,page){
        if(err)
        return console.log(err);
        res.render('admin/edit_page',{
            title:page.title,
            slug:page.slug,
            content:page.content,
            id:page._id
        });
    });
  });

router.post("/edit_page/:id",[
    check('title','Title must have a value').notEmpty(),
    check('content','Content must have a value').notEmpty()
],
function(req,res,next){
    var title =req.body.title;
    var slug=req.body.slug.replace(/\s+/g,'-').toLowerCase();
    if(slug=="")
    {
        slug=title.replace(/\s+/g,'-').toLowerCase();
    }
    var content =req.body.content;
    var id=req.params.id;
    const errors=validationResult(req).errors;
    if(errors.length != 0)
    {
        res.render('admin/edit_page',{errors,title,slug,content,id});
    }
    else {
        console.log('Cap nhat du lieu tu form vao database');
        Page.findOne({slug:slug,_id:{'$ne':id}},function (err,page)
        {
            if(page){
                req.flash('danger','Page slug exists, choose another.');
                res.render('admin/edit_page',{title,slug,content,id});
            }
            else {
                Page.findById(id,function(err,page){
                    if(err) return console.log(err);
                    page.title=title;
                    page.slug=slug;
                    page.content=content;
                    page.save(function(err){
                       if(err) return console.log(err);
                       Page.find(function(err,pages){
                        if(err) console.log(err);
                        else{
                          req.app.locals.pages=pages;
                        }
                      });
                       req.flash('success',"Page updated!");
                       res.redirect('/admin/pages')
                    });
                });
            }
        });
    }
});
// xoa page
router.get('/delete_page/:id', function(req, res, next) {
    Page.findByIdAndDelete(req.params.id,function(err,){
        if(err){
            return console.log(err);
        }
        Page.find(function(err,pages){
            if(err) console.log(err);
            else{
              req.app.locals.pages=pages;
            }
          });
        req.flash('successful',"Page deleted!");
        res.redirect('/admin/pages')
    });
  });
module.exports = router;
