const Ticket = require("../models/Ticket");
const Order = require("../models/Order");

// Create a new ticket
exports.createTicket = async (req, res) => {
    try {
        const { orderId, category, subject, description, priority } = req.body;

        if (!subject || !description || !category) {
            return res.status(400).json({ success: false, message: "Please provide subject, description, and category" });
        }

        // Validate Order Ownership if orderId is provided
        if (orderId) {
            const order = await Order.findOne({ _id: orderId, customer: req.user._id }); // Assuming 'customer' field references user in Order model
            if (!order) {
                // Try checking 'user' field if 'customer' doesn't exist (depends on your Order schema)
                const orderFallback = await Order.findOne({ _id: orderId, user: req.user._id });
                if (!orderFallback) {
                    return res.status(403).json({ success: false, message: "Invalid Order ID or unauthorized access" });
                }
            }
        }

        const ticket = new Ticket({
            user: req.user._id,
            order: orderId || null,
            category,
            subject,
            description,
            priority: priority || "Medium",
            messages: [
                {
                    sender: "user",
                    message: description,
                    timestamp: new Date()
                }
            ]
        });

        await ticket.save();

        res.status(201).json({
            success: true,
            message: "Ticket created successfully",
            ticket
        });
    } catch (error) {
        console.error("Create Ticket Error:", error);
        res.status(500).json({ success: false, message: "Failed to create ticket", error: error.message });
    }
};

// Get all tickets for logged-in user
exports.getMyTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate("order", "orderId totalAmount status");

        res.status(200).json({
            success: true,
            data: tickets
        });
    } catch (error) {
        console.error("Get Tickets Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch tickets" });
    }
};

// Get single ticket details
exports.getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({
            _id: req.params.id,
            user: req.user._id
        }).populate("order");

        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        res.status(200).json({
            success: true,
            data: ticket
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch ticket details" });
    }
};

// Add message (Reply)
exports.addMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const ticket = await Ticket.findOne({ _id: req.params.id, user: req.user._id });

        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        if (ticket.status === "Closed") {
            return res.status(400).json({ success: false, message: "Cannot reply to a closed ticket" });
        }

        ticket.messages.push({
            sender: "user",
            message,
            timestamp: new Date()
        });

        // Auto-reopen if resolved (optional logic)
        if (ticket.status === "Resolved") {
            ticket.status = "Open";
        }

        ticket.updatedAt = Date.now();
        await ticket.save();

        res.status(200).json({
            success: true,
            message: "Message sent",
            data: ticket
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to send message" });
    }
};
