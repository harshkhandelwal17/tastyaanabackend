const mongoose = require('mongoose');

const connect = async () => {
    try {
        
        const connectionString = "mongodb+srv://harsh:harsh@unifiedcampus.i5fit.mongodb.net/onlinestore";
        // const connectionString = "mongodb://localhost:27017/sweetshop";
        await mongoose.connect(connectionString);
        console.log("DATABASE -- connected");
    } catch (error) {
        console.error("DATABASE -- connection error:", error);
        console.log("error",error)
        process.exit(1);
    }
};

module.exports = connect;
