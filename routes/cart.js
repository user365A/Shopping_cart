const { log } = require('debug/src/browser');
var express = require('express');
var router = express.Router();
var Product=require('../models/product');

router.get("/add/:product",function(req,res,next){
    var slug=req.params.product;
    Product.findOne({slug},function(err,p){
        if(err) console.log(err);
        if(typeof req.session.cart ==="undefined"){
            req.session.cart=[];
            req.session.cart.push({
                title:slug,
                qty:1,
                price: parseFloat(p.price).toFixed(2),
                image:'product_image/'+p._id+'/'+p.image
            });
        }
        else {
            var cart=req.session.cart;
            var newItem=true;
            for(var i=0;i<cart.length;i++)
            {
                if(cart[i].title==slug){
                    cart[i].qty++;
                    newItem=false;
                    break;
                }   
            }
            if(newItem){
                cart.push({
                    title:slug,
                    qty:1,
                    price:parseFloat(p.price).toFixed(2),
                    image:'product_image/'+p._id+'/'+p.image
                });
            }    
        }
        console.log(req.session.cart);
        req.flash('success','Product added!');
        res.redirect('back');
    });
});
router.get('/checkout',function(req,res,next){
    if(req.session.cart && req.session.cart.length==0){
        delete req.session.cart;
        res.redirect('/cart/checkout');
    }
    else{
        res.render('checkout',{
            title:'Checkout',cart:req.session.cart
        });
    }
});
router.get('/update/:product',function(req,res,next){
    var slug=req.params.product;
    var cart=req.session.cart;
    var action=req.query.action;
    console.log(action);
    for(var i=0;i<cart.length;i++){
        if(cart[i].title==slug){
            if(action=="add"){
                cart[i].qty++;
            }
            if(action=="remove"){
                cart[i].qty--;
                if(cart[i].qty<1)
                cart.splice(i,1);
            } 
            if(action=="clear"){
                cart.splice(i,1);
                if(cart.length == 0) delete req.session.cart;
            }       
            
        }
    }
    req.flash('success','Cart updated!');
    res.redirect('/cart/checkout');
});
router.get('/clear',function(req,res,next){
    delete req.session.cart;
    req.flash('success','Cart cleared!');
    res.redirect('back');
});
router.get('/buynow',function(req,res){
    delete req.session.cart;
    res.sendStatus(200);
});
module.exports = router;