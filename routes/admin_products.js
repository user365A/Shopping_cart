const { log } = require('debug/src/browser');
var express = require('express');
var router = express.Router();
var fs = require('fs-extra');
var mkdirp = require('mkdirp');
var resizeImg = require('resize-img');
var {check,validationResult}=require('express-validator');
var path=require('path');

var Product=require('../models/product');
var Category=require('../models/category');

function isImage(value,{req}){
    var filename =req.files !== null ? req.files.image.name : "";
    var extension = (path.extname(filename)).toLowerCase();
    switch (extension) {
        case '.jpg': return '.jpg';
        case '.jpeg' : return '.jpeg';
        case '.png': return '.png';
        case '':return '.jpg';
        default : return false;
    }
}
const isValidator=[
    check('title','Title must have a value').notEmpty(),
    check('desc','Description must have a value').notEmpty(),
    check('price','Price must have a value').isDecimal(),
    check('image','You must upload an image').custom(isImage)
]
router.get('/',function(req,res,next) {
    var count;
    Product.countDocuments(function(err,c){
        count=c;
    })
    Product.find(function(err,products){
        res.render('admin/products',{products,count});
    });
});
router.get('/add_product',function(req,res,next){
   var title="";
   var desc="";
   var price="";
   Category.find(function(err,categories){
       res.render('admin/add_product',{title,desc,categories,price});
   });
});
router.post("/add_product",isValidator,function (req,res,next){
    var title=req.body.title;
    var slug=title.replace(/\s+/g,'-').toLowerCase();
    var desc=req.body.desc;
    var price=req.body.price;
    var category = req.body.category;
    var image=req.files !== null ? req.files.image.name : "";
    const errors=validationResult(req).errors;
    if(errors.length != 0)
    {
        Category.find(function(err,categories){
            res.render('admin/add_product',{errors,title,desc,categories,price});
        });
    }
    else {
        Product.findOne({slug:slug},function(err,product){
            if(product){
                req.flash('danger','Product title exists, choose another.');
                Category.find(function(err, categories){
                    res.render('admin/add_product',{title,desc,categories,price});
                });
            }
            else {
                var price2=parseFloat(price).toFixed(2);
                var product = new Product({title,slug,desc,category,price:price2,image});

                product.save(function(err){
                    if(err)return console.log(err);
                    mypath='public/product_image/'+product._id;
                    mkdirp.sync(mypath+'/gallery/thumbs');
                    if(image!=""){
                        var productImage=req.files.image;
                        var tmp = mypath + '/'+image
                        productImage.mv(tmp,function(err){
                            if(err)
                            return console.log(err);
                        });
                    }
                    req.flash('success','Product added!');
                    res.redirect('/admin/products');
                });
            }
        });
    }
});

//edit
router.get('/edit_product/:id',function(req,res,next){
    var errors;
    if(req.session.errors) errors = req.session.errors;
    req.session.errors=null;

    Category.find(function(err,categories){
        Product.findById(req.params.id,function(err,p){
            if(err){
                console.log(err);
                res.redirect('/admin/products');
            }
            else {
                var galleryDir='public/product_image/'+p._id+'/gallery/thumbs';
                var galleryImages=null;
                fs.readdir(galleryDir,function(err,files){
                    
                    if(err) console.log(err);
                    else {
                        galleryImages=files;
                        
                        res.render('admin/edit_product',
                        {
                          title:p.title,errors:errors,desc:p.desc,categories:categories,
                          category:p.category.replace(/\s+/g,'-').toLowerCase(),
                          price:parseFloat(p.price).toFixed(2),
                          galleryImages:galleryImages,id:p._id,image:p.image
                        });
                    }
                });
            }
        });
    });
});
router.post('/edit_product/:id',isValidator,
function(req,res,next){
    var title=req.body.title;
    var slug=title.replace(/\s+/g,'-').toLowerCase();
    var desc=req.body.desc;
    var price=req.body.price;
    var category = req.body.category;
    var imageFile=req.files !== null ? req.files.image.name : "";
    var id=req.params.id;
    var pimage=req.body.pimage;
    const errors= validationResult(req).errors;
    if(errors.length != 0)
    {
        req.session.errors=errors;
        res.redirect('/admin/products/edit_product/'+id);
    }
    else {
        Product.findOne({slug:slug, _id:{'$ne':id}},function(err,p){
           if(err) console.log(err);
           if(p){
               req.flash('danger','Product title exists,choose another.');
               res.redirect('/admin/products/edit_product/'+id)
           }
           else{
               Product.findById(id,function(err,p){
                   if(err) console.log(err);
                   p.title=title;
                   p.slug=slug;
                   p.desc=desc;
                   p.price=parseFloat(price).toFixed(2);
                   p.category=category;
                   if(imageFile != '') p.image=imageFile;
                   p.save(function(err){
                       if(err) console.log(err);
                       if(imageFile != '') {
                           if(pimage != ''){
                               fs.remove('public/product_image/'+id+'/'+pimage, function(err){
                                    if(err) console.log(err);
                               });
                           }
                           var productImage=req.files.image;
                           var tmp='public/product_image/'+id+'/'+imageFile;
                           productImage.mv(tmp,function(err){
                               if(err) return console.log(err);
                           });
                       }
                       req.flash('success','Product updated!');
                       res.redirect('/admin/products/edit_product/'+id);
                   });
               });
           }
        });
    }
});
// upload gallery
router.post('/product_gallery/:id',function(req,res,next){
    var productImage=req.files.file;
    var id=req.params.id;
    var mypath="public/product_image/"+id+"/gallery"+req.files.file.name;
    var thumbsPath="public/product_image/"+id+"/gallery/thumbs/"+req.files.file.name;
    productImage.mv(mypath,function(err){
        if(err) console.log(err);
        resizeImg(fs.readFileSync(mypath),{width:100,height:100}).then(function(buf){
            fs.writeFileSync(thumbsPath,buf);
        });
    });
    res.sendStatus(200);
});
// delete image
router.get('/delete_image/:image',function(req,res,next){
    
    var originalImage="public/product_image/"+req.query.id+"/gallery"+req.params.image;
    var thumbImage="public/product_image/"+req.query.id+"/gallery/thumbs/"+req.params.image;
    fs.remove(originalImage,function(err){
        if(err) console.log(err);
        else {
            fs.remove(thumbImage,function(err){
               if(err) console.log(err);
               else{
                req.flash('success','Image deleted!');
                res.redirect('/admin/products/edit_product/'+req.query.id);
               }
            });
        }
    });
    
});
//xoa san pham
router.get('/delete_product/:id',function(req,res,next){
    var id=req.params.id;
    var mypath='public/product_image/'+id;
    fs.remove(mypath,function(err){
        if(err) console.log(err);
        else {
            Product.findByIdAndRemove(id,function(err){
                console.log(err);
            req.flash('success','Product deleted!');
            res.redirect('/admin/products');
            })
        }
    });
});
module.exports = router;
