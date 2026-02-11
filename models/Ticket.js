const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },
    ticketId: {
        type: String,
        unique: true,
        required: true
    },
    category: {
        type: String,
        enum: ["Order Issue", "Payment", "Account", "Safety", "Other"],
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Open", "In Progress", "Resolved", "Closed"],
        default: "Open"
    },
    priority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Medium"
    },
    messages: [
        {
            sender: {
                type: String,
                enum: ["user", "admin", "support"],
                required: true
            },
            message: {
                type: String,
                required: true
            },
            attachments: [{
                type: String // URL of the uploaded file
            }],
            timestamp: {
                type: Date,
                default: Date.now
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-generate ticketId (e.g., TKT-123456)
ticketSchema.pre("save", function (next) {
    if (!this.ticketId) {
        this.ticketId = "TKT-" + Math.floor(100000 + Math.random() * 900000);
    }
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model("Ticket", ticketSchema);
