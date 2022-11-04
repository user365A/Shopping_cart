var mongoose=require('mongoose');
var CategogySchema=mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    slug:{
        type:String
    }
});
var Categogy = module.exports=mongoose.model('Category',CategogySchema);