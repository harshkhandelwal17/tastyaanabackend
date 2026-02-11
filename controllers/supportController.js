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
            // Validate Order Ownership using 'userId' field from Order model
            const order = await Order.findOne({ _id: orderId, userId: req.user._id });
            if (!order) {
                return res.status(403).json({ success: false, message: "Invalid Order ID or unauthorized access" });
            }
        }

        const ticket = new Ticket({
            user: req.user._id,
            order: orderId || null,
            ticketId: "TKT-" + Math.floor(100000 + Math.random() * 900000), // Explicitly generate ID to pass validation
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

// Get all tickets (Admin)
exports.getAllTickets = async (req, res) => {
    try {
        const { status, search, category, page = 1, limit = 10 } = req.query;
        let query = {};

        if (status && status !== 'All') query.status = status;
        if (category) query.category = category;
        if (search) {
            query.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { ticketId: { $regex: search, $options: 'i' } }
            ];
        }

        const tickets = await Ticket.find(query)
            .populate('user', 'name email phone avatar') // Populate user details
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Ticket.countDocuments(query);

        res.status(200).json({
            success: true,
            data: tickets,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error("Admin Get Tickets Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch tickets" });
    }
};

// Update Ticket Status (Admin)
exports.updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["Open", "In Progress", "Resolved", "Closed"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: Date.now() },
            { new: true }
        );

        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        res.status(200).json({ success: true, message: "Status updated", data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update status" });
    }
};

// Add message (Reply) - Updated for Attachments and Admin
exports.addMessage = async (req, res) => {
    try {
        const { message, attachments } = req.body;
        const sender = req.user.role === 'admin' || req.user.role === 'support' ? 'admin' : 'user';

        // If user, ensure they own the ticket
        let query = { _id: req.params.id };
        if (sender === 'user') {
            query.user = req.user._id;
        }

        const ticket = await Ticket.findOne(query);

        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found" });
        }

        if (ticket.status === "Closed") {
            return res.status(400).json({ success: false, message: "Cannot reply to a closed ticket" });
        }

        ticket.messages.push({
            sender,
            message,
            attachments: attachments || [],
            timestamp: new Date()
        });

        // Auto-reopen if resolved (if user replies)
        if (sender === 'user' && ticket.status === "Resolved") {
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
