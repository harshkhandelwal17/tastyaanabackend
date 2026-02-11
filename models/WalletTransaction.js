const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const walletTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    default: () => uuidv4(),
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  method: {
    type: String,
    enum: ['razorpay', 'card', 'upi', 'netbanking', 'wallet', 'refund', 'cashback'],
    required: true
  },
  referenceId: {
    type: String
  },
  note: {
    type: String,
    trim: true,
    maxlength: 200
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
walletTransactionSchema.index({ user: 1, createdAt: -1 });
walletTransactionSchema.index({ transactionId: 1 });
walletTransactionSchema.index({ referenceId: 1 });

// Virtual for formatted transaction
walletTransactionSchema.virtual('formattedAmount').get(function() {
  return this.type === 'credit' ? `+₹${this.amount}` : `-₹${this.amount}`;
});

// Pre-save hook to validate transaction
walletTransactionSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Validate user exists
    const user = await mongoose.model('User').findById(this.user);
    if (!user) {
      throw new Error('User not found');
    }

    // For debit transactions, check sufficient balance
    if (this.type === 'debit' && this.status === 'completed') {
      if (user.wallet.balance < this.amount) {
        throw new Error('Insufficient wallet balance');
      }
    }
  }
  next();
});

// Post-save hook to update user wallet balance
walletTransactionSchema.post('save', async function(doc) {
  if (doc.status === 'completed') {
    const User = mongoose.model('User');
    const amount = doc.type === 'credit' ? doc.amount : -doc.amount;
    
    await User.findByIdAndUpdate(doc.user, {
      $inc: { 'wallet.balance': amount }
    });
  }
});

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);