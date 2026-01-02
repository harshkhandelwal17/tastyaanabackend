// routes/testRoute.js
const express = require('express');
const router = express.Router();

router.post("/", (req,res)=>{
    console.log("✅ Data Received:", req.body);
    res.status(200).json({success:true, message:"Device connected successfully"});
});

module.exports = router;
