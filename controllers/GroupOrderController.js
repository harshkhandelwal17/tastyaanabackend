const GroupOrder = require('../models/GroupOrder');
const crypto = require('crypto');

// Helper to generate 6-char code
const generateCode = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
};

exports.createGroup = async (req, res) => {
    try {
        const { restaurantId } = req.body;
        const userId = req.user.id; // From middleware

        // Check if user already has an active group (optional, but good for cleanup)
        // const existing = await GroupOrder.findOne({ host: userId, status: 'active' });
        // if (existing) return res.status(200).json({ success: true, group: existing, message: "Resumed existing session" });

        let code = generateCode();
        // Ensure uniqueness (simple retry logic)
        while (await GroupOrder.findOne({ code })) {
            code = generateCode();
        }

        const newGroup = await GroupOrder.create({
            host: userId,
            restaurant: restaurantId || null,
            code,
            participants: [{
                user: userId,
                name: req.user.name,
                avatar: req.user.avatar,
                items: [],
                status: 'active' // Explicitly set status
            }]
        });

        res.status(201).json({ success: true, group: newGroup });
    } catch (error) {
        console.error("Create Group Error:", error);
        res.status(500).json({ success: false, message: "Could not create party" });
    }
};

exports.joinGroup = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;

        const group = await GroupOrder.findOne({ code, status: 'active' });
        if (!group) return res.status(404).json({ success: false, message: "Party not found or ended" });

        // Check if already joined
        const existingParticipant = group.participants.find(p => p.user.toString() === userId);
        if (existingParticipant) {
            existingParticipant.status = 'active'; // Rejoin
        } else {
            group.participants.push({
                user: userId,
                name: req.user.name,
                avatar: req.user.avatar,
                items: []
            });
        }

        await group.save();

        // Notify others via Socket (handled in controller or route via req.app.get('io'))
        const io = req.app.get('io');
        if (io) io.to(code).emit('party_update', { type: 'JOIN', user: req.user.name, group });

        res.status(200).json({ success: true, group });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not join party" });
    }
};

exports.getGroupDetails = async (req, res) => {
    try {
        const { code } = req.params;
        const group = await GroupOrder.findOne({ code })
            .populate('restaurant', 'name address')
            .populate('participants.items.product', 'title name images price isVeg'); // Ensure deep populate for polling
        if (!group) return res.status(404).json({ success: false, message: "Group not found" });
        res.status(200).json({ success: true, group });
    } catch (error) {
        res.status(500).json({ success: false, message: "Fetch error" });
    }
};

// Sync Logic: A participant sends their CURRENT intent of items for this group
exports.syncCart = async (req, res) => {
    try {
        const { code, items } = req.body; // Items: [{ product, qty, ... }]
        const userId = req.user.id;

        const group = await GroupOrder.findOne({ code, status: 'active' });
        if (!group) return res.status(404).json({ success: false, message: "Party inactive" });

        const participant = group.participants.find(p => p.user.toString() === userId);
        if (!participant) return res.status(403).json({ success: false, message: "Not a participant" });

        // Logic: If group has no restaurant, lock it to the first item's restaurant (if provided in item or look it up)
        // For now, assuming Frontend sends consistent items. Validating strictly requires Product lookup.
        // Simplified: If group.restaurant is null and items > 0, we try to set it.
        // NOTE: Ideally we need product->restaurant mapping. 
        // For MVP: We will trust the frontend to separate carts, or we just leave it flexible until checkout.
        // But the user requested "Any restaurant". IF we want to lock it:

        // if (!group.restaurant && items.length > 0) {
        //    // We need to fetch one product to find its restaurant
        //    // const sample = await Product.findById(items[0].product);
        //    // group.restaurant = sample.restaurant;
        // }
        // The user specifically asked "Anyone can add any item". 
        // So we might NOT want to lock it at all? 
        // But `activeGroup` usually implies one restaurant for delivery.
        // Let's implement: If null, set it. If set, we keep it. 
        // But we won't strictly validate here to avoid latency, we'll let frontend warn.

        participant.items = items; // Full replace for simplicity in sync
        await group.save();

        // Populate product details for the emitted group object
        // This ensures frontend gets full product info (name, image, etc.)
        // even if the incoming 'items' only had IDs.
        const populatedGroup = await GroupOrder.findById(group._id)
            .populate('restaurant', 'name address')
            .populate('participants.items.product', 'title name images price isVeg');

        const io = req.app.get('io');
        if (io) {
            console.log(`[GroupOrder] Emitting 'party_update' to rooms: ${code}`);
            io.to(code).emit('party_update', { type: 'CART_UPDATE', user: req.user.name, group: populatedGroup });
        } else {
            console.error("[GroupOrder] IO instance not found on req.app");
        }

        res.status(200).json({ success: true, group: populatedGroup });
    } catch (error) {
        console.error("Sync Error:", error);
        res.status(500).json({ success: false, message: "Sync failed" });
    }
};

exports.leaveGroup = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;
        const group = await GroupOrder.findOne({ code });
        if (group) {
            // remove or mark inactive
            const p = group.participants.find(p => p.user.toString() === userId);
            if (p) p.status = 'left';
            await group.save();

            const io = req.app.get('io');
            if (io) io.to(code).emit('party_update', { type: 'LEAVE', user: req.user.name, group });
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }) }
};

exports.checkActiveGroup = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find the LATEST active group where the user is an ACTIVE participant
        // Using $elemMatch to ensure we match the specific participant entry status
        const group = await GroupOrder.findOne({
            status: 'active',
            participants: {
                $elemMatch: {
                    user: userId,
                    // Check for active OR null (legacy support for groups created before status field)
                    status: { $ne: 'left' }
                }
            }
        })
            .sort({ createdAt: -1 }) // Get the most recent one
            .populate('restaurant', 'name address');

        if (!group) {
            return res.status(200).json({ success: true, group: null });
        }

        res.status(200).json({ success: true, group });
    } catch (error) {
        console.error("Check Active Group Error:", error);
        res.status(500).json({ success: false });
    }
};

exports.completeGroupOrder = async (req, res) => {
    try {
        console.log("[GroupOrder] Completing order. Body:", req.body, "User:", req.user?.id);
        const { code, orderId } = req.body;

        if (!code || !orderId) {
            console.error("[GroupOrder] Missing fields");
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const group = await GroupOrder.findOne({ code, status: 'active' });

        if (!group) {
            console.error("[GroupOrder] Group not active/found for code:", code);
            return res.status(404).json({ success: false, message: "Group not found or inactive" });
        }

        if (group.host.toString() !== req.user.id) {
            console.error("[GroupOrder] Host mismatch");
            return res.status(403).json({ success: false, message: "Only host can complete order" });
        }

        group.status = 'completed';
        group.finalOrderId = orderId;

        // Ensure finalOrderId is saved even if schema strict is on (using workaround if needed)
        // Ideally schema should have it
        await group.save();
        console.log("[GroupOrder] Group status updated to completed");

        const io = req.app.get('io');
        if (io) {
            console.log("[GroupOrder] Emitting ORDER_PLACED");
            io.to(code).emit('party_update', {
                type: 'ORDER_PLACED',
                orderId,
                hostName: req.user.name,
                group
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Complete Group Order Error:", error);
        res.status(500).json({ success: false });
    }
};
