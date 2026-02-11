const mongoose = require('mongoose');

const groupOrderSchema = new mongoose.Schema({
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming restaurants are Users with role 'seller'
        required: false
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'locked', 'ordered', 'completed', 'cancelled'], // Added 'completed'
        default: 'active'
    },
    finalOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: { type: String, required: true },
        avatar: { type: String },
        status: {
            type: String,
            enum: ['active', 'left', 'kicked'],
            default: 'active'
        },
        items: [{
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            name: { type: String },
            price: { type: Number },
            quantity: { type: Number, default: 1 },
            variant: { type: String }, // For size/weight
            image: { type: String }
        }]
    }],
    billSplit: {
        // Cached calculations for "Who owes what"
        type: Map,
        of: Number
    }
}, { timestamps: true });

// Auto-expire groups after 24 hours if not ordered
groupOrderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('GroupOrder', groupOrderSchema);
