const replaceableItems = require('../models/replaceableItems');
const { uploadToCloudinary } = require('../utils/cloudinary');

exports.AddReplaceAbleItems = async (req,res)=>{

    try{
    const {name,price,description,} = req.body;
    const sellerId = req.user._id;
         const items = {}
          
          if (req.files && req.files.length > 0) {
            const imageUrls = [];
            for (let file of req.files) {
              const result = await uploadToCloudinary(file.buffer);
              imageUrls.push({
                url: result.secure_url, 
                alt: req.body.name,
                isPrimary: imageUrls.length === 0
              });
            }
            items.image = imageUrls;
          }

    items = {...items,price,description,name};
    const ReplaceAbleItems = new replaceableItems(items);
    const savedItems = await ReplaceAbleItems.save();
     
    res.status(200).json({
        success:true,
        message:"Items added successfully",
        items:savedItems
    })


    }catch(error){
     console.log("Error occured",error);
     res.status(500).json({
        success:false,
        error:error.message,       
     })
    }

}


exports.GetReplaceAbleItems = async (req,res)=>{
 try{

  const sellerId = req.user._id;

  const replaceAbleItems = await replaceableItems.find({sellerId});

  res.status(200).json({
    success:true,
    message:'Data retrieved successfully',
    replaceAbleItems
  })
    
 }catch(error){
  console.log("An error occured inside getReplaceAbleItems",error);
  res.status(500).json({
    success:false,
    error:error.message
  })
 }

}