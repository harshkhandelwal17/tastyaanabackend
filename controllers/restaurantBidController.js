const Bid = require('../models/Bid');
const MealRequest = require('../models/MealRequest');
const Notification = require('../models/Notification');
const { NotFoundError, BadRequestError } = require('../errors');

/**
 * @desc    Create a bid for a meal request
 * @route   POST /api/bids
 * @access  Private (Chef)
 */
exports.createBid = async (req, res) => {
  const { requestId, price, message, deliveryTime } = req.body;

  const mealRequest = await MealRequest.findOne({
    _id: requestId,
    status: 'open'
  });

  if (!mealRequest) {
    throw new NotFoundError('Meal request not found or not open for bidding');
  }

  // Check if chef already bid on this request
  const existingBid = await Bid.findOne({
    request: requestId,
    chef: req.user._id
  });

  if (existingBid) {
    throw new BadRequestError('You have already placed a bid on this request');
  }

  const bid = new Bid({
    request: requestId,
    chef: req.user._id,
    price,
    message,
    deliveryTime,
    status: 'pending'
  });

  await bid.save();

  // Notify customer
  const notification = new Notification({
    userId: mealRequest.user,
    title: 'New Bid Received',
    message: `${req.user.name} placed a bid on your meal request`,
    type: 'bid',
    data: { requestId, bidId: bid._id }
  });
  await notification.save();

  res.status(201).json({
    success: true,
    data: bid
  });
};

/**
 * @desc    Get all bids for a meal request
 * @route   GET /api/bids/request/:requestId
 * @access  Private (Request Owner)
 */
exports.getRequestBids = async (req, res) => {
  const bids = await Bid.find({
    request: req.params.requestId
  })
    .populate('chef', 'name avatar')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: bids
  });
};

/**
 * @desc    Accept a bid
 * @route   PUT /api/bids/:bidId/accept
 * @access  Private (Request Owner)
 */
exports.acceptBid = async (req, res) => {
  const bid = await Bid.findOneAndUpdate(
    {
      _id: req.params.bidId,
      status: 'pending'
    },
    {
      status: 'accepted'
    },
    { new: true }
  ).populate('request');

  if (!bid) {
    throw new NotFoundError('Bid not found or already processed');
  }

  // Update meal request
  await MealRequest.findByIdAndUpdate(bid.request._id, {
    status: 'accepted',
    acceptedBid: bid._id,
    chef: bid.chef
  });

  // Reject all other bids
  await Bid.updateMany(
    {
      request: bid.request._id,
      _id: { $ne: bid._id },
      status: 'pending'
    },
    {
      status: 'rejected'
    }
  );

  // Notify chef
  const notification = new Notification({
    userId: bid.chef,
    title: 'Bid Accepted',
    message: `Your bid for ${bid.request.title} has been accepted`,
    type: 'bid',
    data: { requestId: bid.request._id }
  });
  await notification.save();

  res.json({
    success: true,
    data: bid
  });
};

/**
 * @desc    Reject a bid
 * @route   PUT /api/bids/:bidId/reject
 * @access  Private (Request Owner)
 */
exports.rejectBid = async (req, res) => {
  const bid = await Bid.findOneAndUpdate(
    {
      _id: req.params.bidId,
      status: 'pending'
    },
    {
      status: 'rejected'
    },
    { new: true }
  );

  if (!bid) {
    throw new NotFoundError('Bid not found or already processed');
  }

  // Notify chef
  const notification = new Notification({
    userId: bid.chef,
    title: 'Bid Rejected',
    message: `Your bid for request #${bid.request} has been rejected`,
    type: 'bid',
    data: { requestId: bid.request }
  });
  await notification.save();

  res.json({
    success: true,
    data: bid
  });
};

/**
 * @desc    Withdraw a bid
 * @route   PUT /api/bids/:bidId/withdraw
 * @access  Private (Chef)
 */
exports.withdrawBid = async (req, res) => {
  const bid = await Bid.findOneAndUpdate(
    {
      _id: req.params.bidId,
      chef: req.user._id,
      status: 'pending'
    },
    {
      status: 'withdrawn'
    },
    { new: true }
  ).populate('request', 'user');

  if (!bid) {
    throw new NotFoundError('Bid not found or already processed');
  }

  // Notify customer
  const notification = new Notification({
    userId: bid.request.user,
    title: 'Bid Withdrawn',
    message: `${req.user.name} withdrew their bid on your request`,
    type: 'bid',
    data: { requestId: bid.request._id }
  });
  await notification.save();

  res.json({
    success: true,
    data: bid
  });
};