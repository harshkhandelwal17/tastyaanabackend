const express = require("express");
const router = express.Router();
// const { protect } = require("../middleware/auth");
const { createTicket, getMyTickets, getTicketById, addMessage } = require("../controllers/supportController");

// All routes are protected
// router.use(protect);

router.post("/", createTicket);
router.get("/", getMyTickets);
router.get("/:id", getTicketById);
router.post("/:id/message", addMessage);

module.exports = router;
