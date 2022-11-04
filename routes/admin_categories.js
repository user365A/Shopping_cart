const { log } = require('debug/src/browser');
const Category = require('../models/category');
var express = require('express');
var router = express.Router();
var {check,validationResult}=require('express-validator');
/* GET home page. */
router.get('/', function(req, res, next) {
    Category.find({}).exec(function(err,categories){
        res.render('admin/categories',{ categories });
      });
});
//add category
router.get('/add_category', function(req, res, next) {
    var title="";
    res.render('admin/add_category',{title});
  });
router.post("/add_category",[
    check('title','Title must have a value').notEmpty(),
],
function(req,res,next){
    var title =req.body.title;
    var slug=title.replace(/\s+/g,'-').toLowerCase();
    const errors=validationResult(req).errors;
    if(errors.length != 0)
    {
        console.log('loi');
        res.render('admin/add_category',{errors,title});
    }
    else {
        Category.findOne({slug},function (err,category)
        {
            if(category){
                req.flash('danger','Page slug exists, choose another.');
                res.render('admin/add_category',{title});
            }
            else {
                var Categogy = new Category({title,slug});
                Categogy.save(function(err){
                    if(err)
                    return console.log(err);
                    Category.find(function(err,categories){
                        if(err) console.log(err);
                        else{
                          req.app.locals.categories=categories;
                        }
                      });
                    req.flash('success','Category added');
                    res.redirect('/admin/categories');
                });
            }
        });
    }
})
router.get('/edit_category/:id', function(req, res, next) {
    Category.findById(req.params.id,function(err,category){
        if(err)
        return console.log(err);
        res.render('admin/edit_category',{
            title:category.title,
            id:category._id
        });
    });
  });

router.post("/edit_category/:id",[
    check('title','Title must have a value').notEmpty(),
],
function(req,res,next){
    var title =req.body.title;
    var slug=title.replace(/\s+/g,'-').toLowerCase();
    var id=req.params.id;
    const errors=validationResult(req).errors;
    if(errors.length != 0)
    {
        res.render('admin/edit_page',{errors,title,slug,content,id});
    }
    else {
        console.log('Cap nhat du lieu tu form vao database');
        Category.findOne({slug:slug,_id:{'$ne':id}},function (err,category)
        {
            if(category){
                req.flash('danger','Category title exists, choose another.');
                res.render('admin/edit_category',{title,id});
            }
            else {
                Category.findById(id,function(err,category){
                    if(err) return console.log(err);
                    category.title=title;
                    category.slug=slug;
                    category.save(function(err){
                       if(err) return console.log(err);
                       Category.find(function(err,categories){
                        if(err) console.log(err);
                        else{
                          req.app.locals.categories=categories;
                        }
                      });
                       req.flash('success',"Category updated!");
                       res.redirect('/admin/categories')
                    });
                });
            }
        });
    }
})
// xoa category
router.get('/delete_category/:id', function(req, res, next) {
    Category.findByIdAndDelete(req.params.id,function(err,){
        if(err){
            return console.log(err);
        }Category
        Category.find(function(err,categories){
            if(err) console.log(err);
            else{
              req.app.locals.categories=categories;
            }
          });
        req.flash('successful',"Category deleted!");
        res.redirect('/admin/categories');
    });
  });
module.exports = router;