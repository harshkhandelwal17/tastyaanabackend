const express = require("express");
const router = express.Router();
const { authenticate, adminOnly } = require("../middlewares/auth");
const { createTicket, getMyTickets, getTicketById, addMessage, getAllTickets, updateTicketStatus } = require("../controllers/supportController");

// User routes (authenticate is applied globally below if moved, but let's be specific)
router.use(authenticate);

router.post("/", createTicket);
router.get("/", getMyTickets);
router.get("/:id", getTicketById);
router.post("/:id/message", addMessage); // Works for both User (own ticket) and Admin (any ticket provided controller logic handles permission)

// Admin Routes
router.get("/admin/all", adminOnly, getAllTickets);
router.patch("/admin/:id/status", adminOnly, updateTicketStatus);

module.exports = router;
