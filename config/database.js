const mongoose = require('mongoose');

const connect = async () => {
    try {
        
        const connectionString = "mongodb://harsh:harsh@unifiedcampus-shard-00-00.i5fit.mongodb.net:27017,unifiedcampus-shard-00-01.i5fit.mongodb.net:27017,unifiedcampus-shard-00-02.i5fit.mongodb.net:27017/onlinestore?ssl=true&replicaSet=atlas-ivxkaa-shard-0&authSource=admin&retryWrites=true";
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
