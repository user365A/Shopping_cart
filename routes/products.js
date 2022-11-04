const { log } = require('debug/src/browser');
var express = require('express');
var router = express.Router();

var Product=require('../models/product');
var Category=require('../models/category');
var fs=require('fs-extra');
var mkdirp = require('mkdirp');
var resizeImg = require('resize-img');
var {check,validationResult}=require('express-validator');
var path=require('path');
const e = require('connect-flash');

/* GET home page. */
router.get('/', function(req, res, next) {
  Product.find(function(err,products){
     if(err) console.log(err);
     res.render("all_products",{title:'All products',products});
  });
});
router.get('/:category', function(req, res, next) {
  var categorySlug=req.params.category;
  Category.findOne({slug:categorySlug},function(err,c){
    Product.find({category:categorySlug},function(err,products){
        console.log(products);
        if(err) console.log(err);
        res.render("cat_products",{title:c.title,products});
    })
 });
});
router.get("/:category/:product",function(req,res,next){
    var galleryImages=null;
    // var loggedIn=req.isAuthenticated() ? true :false;
    Product.findOne({slug:req.params.product},function(err,product){
        if(err) console.log(err);
        else {
            var galleryDir='public/product_image/' + product.id + '/gallery/thumbs';
            fs.readdir(galleryDir,function(err,files){
                if(err) console.log(err);
                else{
                    galleryImages=files;
                    res.render('detail_product',{title:product.title,p:product,galleryImages});
                }
            });
        }
    });
});
module.exports = router;