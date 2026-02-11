const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:\\Users\\harsh\\Desktop\\tastyaanav2\\server\\.env' });

const dropIndex = async () => {
    try {
        console.log('Connecting to MongoDB...');
        // Handle potential quotes or spaces in .env value
        const uri = process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/"/g, '').trim() : null;

        if (!uri) {
            console.error('SERVER ENV CONTENT:', require('fs').readFileSync('c:\\Users\\harsh\\Desktop\\tastyaanav2\\server\\.env', 'utf8'));
            throw new Error(`MONGODB_URI is undefined. Loaded path: c:\\Users\\harsh\\Desktop\\tastyaanav2\\server\\.env`);
        }

        await mongoose.connect(uri);
        console.log('Connected.');

        const collection = mongoose.connection.collection('subscriptions');

        console.log('Listing indexes...');
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes.map(i => i.name));

        const indexName = 'unique_active_subscription_per_user';
        const blockingIndex = indexes.find(i => i.name === indexName) || indexes.find(i => i.key.user === 1 && i.key.status === 1);

        if (blockingIndex) {
            console.log(`Dropping index: ${blockingIndex.name}...`);
            await collection.dropIndex(blockingIndex.name);
            console.log('✅ Index dropped successfully.');
        } else {
            console.log('ℹ️ No blocking index found. You are good to go.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

dropIndex();
