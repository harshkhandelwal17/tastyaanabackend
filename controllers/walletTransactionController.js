const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');
const Razorpay = require('razorpay');

// Debug log for Razorpay config (Masked)


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ============================================
// 1. Get Wallet Balance
// ============================================
const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('wallet loyaltyPoints');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        balance: user.wallet.balance || 0,
        loyaltyPoints: user.loyaltyPoints || 0,
        lastUpdated: user.wallet.lastTopUp || user.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet balance'
    });
  }
};

// ============================================
// 2. Add Money to Wallet
// ============================================
const addMoneyToWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum amount to add is ₹10'
      });
    }

    if (amount > 50000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum amount to add is ₹50,000'
      });
    }

    // Create Razorpay order for wallet top-up
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `w_${userId.toString().slice(-6)}_${Date.now().toString().slice(-8)}`, // Max 40 chars
      notes: {
        purpose: 'wallet_topup',
        userId: userId.toString(),
        amount: amount.toString()
      }
    });

    // Create pending wallet transaction
    const walletTransaction = new WalletTransaction({
      user: userId,
      amount: amount,
      type: 'credit',
      status: 'pending',
      method: 'razorpay',
      referenceId: razorpayOrder.id,
      note: 'Wallet top-up',
      metadata: {
        razorpayOrderId: razorpayOrder.id,
        purpose: 'wallet_topup'
      }
    });

    await walletTransaction.save();

    res.status(200).json({
      success: true,
      message: 'Payment order created for wallet top-up',
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
        transactionId: walletTransaction.transactionId
      }
    });

  } catch (error) {
    console.error('Error creating wallet top-up order:', error);
    res.status(500).json({
      success: false,
      message: `Failed to create wallet top-up order: ${error.message || JSON.stringify(error)}`
    });
  }
};

// ============================================
// 3. Verify Wallet Top-up Payment
// ============================================
const verifyWalletTopup = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transactionId
    } = req.body;

    const userId = req.user.id;

    // Verify payment signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Find the pending transaction
    const walletTransaction = await WalletTransaction.findOne({
      transactionId: transactionId,
      user: userId,
      status: 'pending',
      referenceId: razorpay_order_id
    });

    if (!walletTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Get payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const paidAmount = payment.amount / 100; // Convert from paise

    if (paidAmount !== walletTransaction.amount) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount mismatch'
      });
    }

    // Update transaction status
    walletTransaction.status = 'completed';
    walletTransaction.metadata.razorpayPaymentId = razorpay_payment_id;
    walletTransaction.metadata.paymentDetails = {
      method: payment.method,
      bank: payment.bank,
      cardId: payment.card_id,
      status: payment.status
    };

    await walletTransaction.save();

    // Update user's balance and last top-up time
    await User.findByIdAndUpdate(userId, {
      $inc: { 'wallet.balance': walletTransaction.amount },
      $set: { 'wallet.lastTopUp': new Date() }
    });

    // Fetch updated balance for response
    const user = await User.findById(userId).select('wallet');

    res.status(200).json({
      success: true,
      message: 'Wallet topped up successfully',
      data: {
        transactionId: walletTransaction.transactionId,
        amount: walletTransaction.amount,
        newBalance: user.wallet.balance,
        payment: {
          razorpayPaymentId: razorpay_payment_id,
          method: payment.method
        }
      }
    });

  } catch (error) {
    console.error('Error verifying wallet top-up:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify wallet top-up'
    });
  }
};

// ============================================
// 3.5. Handle Wallet Payment Failure
// ============================================
const handleWalletPaymentFailure = async (req, res) => {
  try {
    const { recordId, error } = req.body;
    const userId = req.user.id;

    console.log(`Handling wallet payment failure for record: ${recordId}`, error);

    // Find transaction by transactionId or _id
    // RazorpayComponent might send recordId which maps to transactionId
    const walletTransaction = await WalletTransaction.findOne({
      $or: [{ transactionId: recordId }, { _id: recordId }],
      user: userId,
      status: 'pending'
    });

    if (walletTransaction) {
      walletTransaction.status = 'failed';
      walletTransaction.metadata = {
        ...walletTransaction.metadata,
        failureReason: error?.description || 'Payment Failed/Cancelled',
        errorDetails: error
      };
      await walletTransaction.save();

      return res.status(200).json({
        success: true,
        message: 'Transaction marked as failed'
      });
    }

    // If not found or already processed
    return res.status(404).json({
      success: false,
      message: 'Transaction not found or already processed'
    });

  } catch (error) {
    console.error('Error handling wallet payment failure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment failure'
    });
  }
};

// ============================================
// 4. Get Wallet Transactions
// ============================================
const getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      type,
      status,
      startDate,
      endDate,
      method
    } = req.query;

    // Build filter
    const filter = { user: userId };

    if (type && ['credit', 'debit'].includes(type)) {
      filter.type = type;
    }

    if (status && ['pending', 'completed', 'failed', 'refunded'].includes(status)) {
      filter.status = status;
    }

    if (method && ['razorpay', 'card', 'upi', 'netbanking', 'wallet', 'refund', 'cashback'].includes(method)) {
      filter.method = method;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const transactions = await WalletTransaction.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await WalletTransaction.countDocuments(filter);

    // Calculate aggregated stats
    const stats = await WalletTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCredit: {
            $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] }
          },
          totalDebit: {
            $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] }
          },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        stats: stats[0] || {
          totalAmount: 0,
          totalCredit: 0,
          totalDebit: 0,
          totalTransactions: 0
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching all wallet transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet transactions'
    });
  }
};

// ============================================
// 9. Admin: Manual Wallet Adjustment
// ============================================
const manualWalletAdjustment = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { userId, amount, type, reason } = req.body;

    if (!userId || !amount || !type || !reason) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (!['credit', 'debit'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either credit or debit'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // For debit, check if user has sufficient balance
    if (type === 'debit' && user.wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'User has insufficient wallet balance'
      });
    }

    // Create adjustment transaction
    const adjustmentTransaction = new WalletTransaction({
      user: userId,
      amount: amount,
      type: type,
      status: 'completed',
      method: 'adjustment',
      referenceId: `ADMIN_${Date.now()}`,
      note: `Admin adjustment: ${reason}`,
      metadata: {
        adjustedBy: req.user.id,
        adjustedByEmail: req.user.email,
        reason: reason,
        previousBalance: user.wallet.balance
      }
    });

    await adjustmentTransaction.save();

    // Get updated user data
    const updatedUser = await User.findById(userId).select('wallet');

    res.status(200).json({
      success: true,
      message: 'Wallet adjustment completed successfully',
      data: {
        transactionId: adjustmentTransaction.transactionId,
        user: {
          id: userId,
          name: user.name,
          email: user.email
        },
        adjustment: {
          type: type,
          amount: amount,
          reason: reason
        },
        balances: {
          previous: user.wallet.balance,
          current: updatedUser.wallet.balance
        }
      }
    });

  } catch (error) {
    console.error('Error processing manual wallet adjustment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process wallet adjustment'
    });
  }
};

// ============================================
// 10. Wallet Analytics (Admin)
// ============================================
const getWalletAnalytics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { period = '30d' } = req.query;

    // Calculate date range
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Overall stats
    const [totalStats, periodStats, dailyStats] = await Promise.all([
      // Total wallet stats
      WalletTransaction.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),

      // Period stats
      WalletTransaction.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),

      // Daily breakdown for the period
      WalletTransaction.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              type: '$type'
            },
            amount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ])
    ]);

    // Process stats
    const processStats = (stats) => {
      const result = { credit: { amount: 0, count: 0 }, debit: { amount: 0, count: 0 } };
      stats.forEach(stat => {
        result[stat._id] = { amount: stat.totalAmount, count: stat.count };
      });
      return result;
    };

    // Active wallets count
    const activeWallets = await User.countDocuments({
      'wallet.balance': { $gt: 0 }
    });

    // Top users by wallet balance
    const topUsers = await User.find({
      'wallet.balance': { $gt: 0 }
    })
      .select('name email wallet.balance')
      .sort({ 'wallet.balance': -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        period: period,
        dateRange: {
          startDate: startDate,
          endDate: new Date()
        },
        overview: {
          activeWallets: activeWallets,
          totalStats: processStats(totalStats),
          periodStats: processStats(periodStats)
        },
        dailyBreakdown: dailyStats,
        topUsers: topUsers
      }
    });

  } catch (error) {
    console.error('Error fetching wallet analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet analytics'
    });
  }
};

// 5. Transfer Money (User to User) - Optional Feature
// ============================================
const transferMoney = async (req, res) => {
  try {
    const { recipientEmail, amount, note } = req.body;
    const userId = req.user.id;

    if (!recipientEmail || !amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transfer details'
      });
    }

    if (amount > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum transfer amount is ₹10,000'
      });
    }

    // Find sender and recipient
    const [sender, recipient] = await Promise.all([
      User.findById(userId),
      User.findOne({ email: recipientEmail })
    ]);

    if (!sender || !recipient) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (sender._id.toString() === recipient._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer money to yourself'
      });
    }

    // Check sender balance
    if (sender.wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }

    // Create transactions
    const transferId = `TXN_${Date.now()}`;

    // Debit from sender
    const debitTransaction = new WalletTransaction({
      user: sender._id,
      amount: amount,
      type: 'debit',
      status: 'completed',
      method: 'wallet',
      referenceId: transferId,
      note: `Transfer to ${recipient.name} (${recipientEmail})`,
      metadata: {
        transferType: 'sent',
        recipientId: recipient._id,
        recipientEmail: recipientEmail,
        transferNote: note
      }
    });

    // Credit to recipient
    const creditTransaction = new WalletTransaction({
      user: recipient._id,
      amount: amount,
      type: 'credit',
      status: 'completed',
      method: 'wallet',
      referenceId: transferId,
      note: `Transfer from ${sender.name} (${sender.email})`,
      metadata: {
        transferType: 'received',
        senderId: sender._id,
        senderEmail: sender.email,
        transferNote: note
      }
    });

    // Save both transactions
    await Promise.all([
      debitTransaction.save(),
      creditTransaction.save()
    ]);

    res.status(200).json({
      success: true,
      message: 'Money transferred successfully',
      data: {
        transferId: transferId,
        amount: amount,
        recipient: {
          name: recipient.name,
          email: recipient.email
        },
        senderNewBalance: sender.wallet.balance - amount
      }
    });

  } catch (error) {
    console.error('Error transferring money:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to transfer money'
    });
  }
};

// ============================================
// 6. Wallet Statement/Export
// ============================================
const generateWalletStatement = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, format = 'json' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Fetch transactions
    const transactions = await WalletTransaction.find({
      user: userId,
      createdAt: { $gte: start, $lte: end },
      status: 'completed'
    }).sort({ createdAt: 1 }).lean();

    // Calculate running balance
    let runningBalance = 0;
    const statement = transactions.map(txn => {
      if (txn.type === 'credit') {
        runningBalance += txn.amount;
      } else {
        runningBalance -= txn.amount;
      }

      return {
        date: txn.createdAt,
        transactionId: txn.transactionId,
        description: txn.note,
        type: txn.type,
        amount: txn.amount,
        balance: runningBalance,
        method: txn.method,
        status: txn.status
      };
    });

    // Get user details
    const user = await User.findById(userId).select('name email phone');

    const statementData = {
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      period: {
        startDate: start,
        endDate: end
      },
      summary: {
        totalTransactions: transactions.length,
        totalCredit: transactions
          .filter(t => t.type === 'credit')
          .reduce((sum, t) => sum + t.amount, 0),
        totalDebit: transactions
          .filter(t => t.type === 'debit')
          .reduce((sum, t) => sum + t.amount, 0),
        openingBalance: statement[0]?.balance - (statement[0]?.type === 'credit' ? statement[0]?.amount : -statement[0]?.amount) || 0,
        closingBalance: statement[statement.length - 1]?.balance || 0
      },
      transactions: statement
    };

    if (format === 'csv') {
      // Generate CSV format
      const csvHeader = 'Date,Transaction ID,Description,Type,Amount,Balance,Method,Status\n';
      const csvData = statement.map(txn =>
        `${txn.date},${txn.transactionId},"${txn.description}",${txn.type},${txn.amount},${txn.balance},${txn.method},${txn.status}`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="wallet_statement_${userId}_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}.csv"`);
      res.send(csvHeader + csvData);
    } else {
      res.status(200).json({
        success: true,
        data: statementData
      });
    }

  } catch (error) {
    console.error('Error generating wallet statement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate wallet statement'
    });
  }
};

// ============================================
// 7. Low Balance Alert Check
// ============================================
const checkLowBalanceAlert = async (req, res) => {
  try {
    const userId = req.user.id;
    const { threshold = 100 } = req.query; // Default threshold ₹100

    const user = await User.findById(userId).select('wallet');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isLowBalance = user.wallet.balance < threshold;

    res.status(200).json({
      success: true,
      data: {
        currentBalance: user.wallet.balance,
        threshold: threshold,
        isLowBalance: isLowBalance,
        recommendedTopup: isLowBalance ? Math.max(500, threshold * 2) : 0
      }
    });

  } catch (error) {
    console.error('Error checking low balance alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check balance'
    });
  }
};

// ============================================
// Export Functions
// ============================================
module.exports = {
  getWalletBalance,
  addMoneyToWallet,
  verifyWalletTopup,
  getWalletTransactions,
  transferMoney,
  generateWalletStatement,
  checkLowBalanceAlert,
  //   getAllWalletTransactions,
  manualWalletAdjustment,
  getWalletAnalytics,
  handleWalletPaymentFailure
};