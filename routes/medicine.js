const express = require('express');
const router = express.Router();
const MedicineLog = require('../models/MedicineLog');

router.post('/', async (req,res)=>{
    try{
        const { deviceId, time, action } = req.body;
        const log = new MedicineLog({ deviceId, time, action });
        await log.save();
        console.log("✅ Data received:", req.body);
        res.status(200).json({ success: true, message: "Data saved" });
    }catch(err){
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.get('/', async (req,res)=>{
    try{
        const logs = await MedicineLog.find().sort({createdAt:-1}).limit(20);
        res.status(200).json(logs);
    }catch(err){
        res.status(500).json({ success:false, message:"Server error"});
    }
});

module.exports = router;
