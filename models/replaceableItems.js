const mongoose = require('mongoose')
const {Schema,model} = mongoose;

const ReplaceItems = new Schema({
    name:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    image:[{
        type:String,
    }],
    description:{
    type:String,
    },
    sellerId:{
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: true
    }
},{
    timestamps:true
})

const replaceableItems =  model('ReplaceableItem',ReplaceItems);

module.exports =  replaceableItems;