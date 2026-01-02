import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Wallet,
  Plus,
  Minus,
  CreditCard,
  Smartphone,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';

const WalletManagement = () => {
  const [walletData, setWalletData] = useState({
    balance: 0,
    transactions: [],
    loading: true
  });
  const [showBalance, setShowBalance] = useState(true);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [paymentMethod, setPaymentMethod] = useState('upi');

  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    // Mock API call - replace with actual API
    setTimeout(() => {
      setWalletData({
        balance: 2547.50,
        loading: false,
        transactions: [
          {
            id: 'txn_001',
            transactionId: 'TXN_ABC123',
            type: 'debit',
            amount: 105,
            note: 'Morning meal deduction - Premium Thali',
            method: 'wallet',
            status: 'completed',
            createdAt: '2024-01-15T08:00:00Z',
            metadata: {
              subscriptionId: 'SUB_001',
              mealType: 'morning'
            }
          },
          {
            id: 'txn_002',
            transactionId: 'TXN_DEF456',
            type: 'debit',
            amount: 105,
            note: 'Evening meal deduction - Premium Thali',
            method: 'wallet',
            status: 'completed',
            createdAt: '2024-01-14T19:00:00Z',
            metadata: {
              subscriptionId: 'SUB_001',
              mealType: 'evening'
            }
          },
          {
            id: 'txn_003',
            transactionId: 'TXN_GHI789',
            type: 'credit',
            amount: 2000,
            note: 'Wallet top-up',
            method: 'razorpay',
            status: 'completed',
            createdAt: '2024-01-14T10:30:00Z',
            metadata: {
              razorpayPaymentId: 'pay_123456789'
            }
          },
          {
            id: 'txn_004',
            transactionId: 'TXN_JKL012',
            type: 'credit',
            amount: 50,
            note: 'Cashback for subscription',
            method: 'cashback',
            status: 'completed',
            createdAt: '2024-01-13T15:45:00Z'
          },
          {
            id: 'txn_005',
            transactionId: 'TXN_MNO345',
            type: 'debit',
            amount: 500,
            note: 'Failed meal deduction - Insufficient balance',
            method: 'wallet',
            status: 'failed',
            createdAt: '2024-01-12T08:00:00Z'
          }
        ]
      });
    }, 1000);
  };

  const handleAddMoney = async () => {
    const amount = parseFloat(addAmount);
    
    if (!amount || amount < 10) {
      alert('Minimum amount is ₹10');
      return;
    }
    
    if (amount > 50000) {
      alert('Maximum amount is ₹50,000');
      return;
    }

    try {
      // Create Razorpay order
      const response = await fetch('/api/wallet/add-money', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ amount })
      });

      const data = await response.json();

      if (data.success) {
        // Initialize Razorpay payment
        const options = {
          key: data.data.key,
          amount: data.data.amount,
          currency: data.data.currency,
          order_id: data.data.razorpayOrderId,
          name: 'TastyAana Wallet',
          description: 'Add money to wallet',
          image: '/logo.png',
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone
          },
          theme: {
            color: '#3B82F6'
          },
          handler: async (response) => {
            // Verify payment
            const verifyResponse = await fetch('/api/wallet/verify-topup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                transactionId: data.data.transactionId
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              setShowAddMoneyModal(false);
              setAddAmount('');
              fetchWalletData(); // Refresh wallet data
              alert('Money added successfully!');
            } else {
              alert('Payment verification failed');
            }
          },
          modal: {
            ondismiss: () => {
              console.log('Payment modal closed');
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        alert(data.message || 'Failed to create payment order');
      }
    } catch (error) {
      console.error('Error adding money:', error);
      alert('Failed to add money. Please try again.');
    }
  };

  const filteredTransactions = walletData.transactions.filter(txn => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'credit') return txn.type === 'credit';
    if (selectedFilter === 'debit') return txn.type === 'debit';
    if (selectedFilter === 'failed') return txn.status === 'failed';
    return true;
  });

  const calculateStats = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = walletData.transactions.filter(
      txn => new Date(txn.createdAt) >= thirtyDaysAgo && txn.status === 'completed'
    );

    const totalCredit = recentTransactions
      .filter(txn => txn.type === 'credit')
      .reduce((sum, txn) => sum + txn.amount, 0);

    const totalDebit = recentTransactions
      .filter(txn => txn.type === 'debit')
      .reduce((sum, txn) => sum + txn.amount, 0);

    return { totalCredit, totalDebit, netFlow: totalCredit - totalDebit };
  };

  const stats = calculateStats();

  const AddMoneyModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Add Money to Wallet</h3>
          <button
            onClick={() => setShowAddMoneyModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                ₹
              </span>
              <input
                type="number"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="Enter amount"
                min="10"
                max="50000"
                className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum: ₹10 | Maximum: ₹50,000
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Select
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[500, 1000, 2000, 5000, 10000, 20000].map(amount => (
                <button
                  key={amount}
                  onClick={() => setAddAmount(amount.toString())}
                  className="p-2 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-sm font-medium transition-colors"
                >
                  ₹{amount}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="space-y-2">
              {[
                { id: 'upi', label: 'UPI', icon: Smartphone },
                { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
                { id: 'netbanking', label: 'Net Banking', icon: CreditCard }
              ].map(method => {
                const Icon = method.icon;
                return (
                  <label
                    key={method.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <Icon className="w-5 h-5 text-gray-600 mr-3" />
                    <span className="font-medium">{method.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setShowAddMoneyModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAddMoney}
            disabled={!addAmount || parseFloat(addAmount) < 10}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Money
          </button>
        </div>
      </div>
    </div>
  );

  if (walletData.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-['Plus_Jakarta_Sans']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Wallet
            </h1>
            <p className="text-gray-600">
              Manage your wallet balance and transactions
            </p>
          </div>
          <button
            onClick={() => setShowAddMoneyModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Money
          </button>
        </div>

        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl text-white p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-lg p-2">
                <Wallet className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Wallet Balance</h2>
                <p className="text-blue-100">Available for payments</p>
              </div>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
            >
              {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="mb-6">
            <div className="text-4xl font-bold mb-2">
              {showBalance ? `₹${walletData.balance.toLocaleString()}` : '₹****'}
            </div>
            {walletData.balance < 500 && (
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-300/30 rounded-lg p-3 mt-4">
                <AlertTriangle className="w-5 h-5 text-red-200" />
                <span className="text-sm text-red-200">
                  Low balance! Add money to avoid service interruption.
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownLeft className="w-4 h-4 text-red-300" />
                <span className="text-sm text-blue-100">Money Spent (30d)</span>
              </div>
              <div className="text-2xl font-bold">₹{stats.totalDebit.toLocaleString()}</div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {stats.netFlow >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-300" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-300" />
                )}
                <span className="text-sm text-blue-100">Net Flow (30d)</span>
              </div>
              <div className={`text-2xl font-bold ${stats.netFlow >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                ₹{Math.abs(stats.netFlow).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => setShowAddMoneyModal(true)}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 rounded-lg p-2">
                <Plus className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-semibold text-gray-900">Add Money</span>
            </div>
            <p className="text-sm text-gray-600">Top up your wallet instantly</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 rounded-lg p-2">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-semibold text-gray-900">Statement</span>
            </div>
            <p className="text-sm text-gray-600">Download transaction history</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 rounded-lg p-2">
                <RefreshCw className="w-5 h-5 text-purple-600" />
              </div>
              <span className="font-semibold text-gray-900">Auto Top-up</span>
            </div>
            <p className="text-sm text-gray-600">Set automatic recharge</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-orange-100 rounded-lg p-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <span className="font-semibold text-gray-900">Alerts</span>
            </div>
            <p className="text-sm text-gray-600">Manage balance alerts</p>
          </button>
        </div>

        {/* Transactions Section */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Recent Transactions
              </h3>
              <div className="flex items-center gap-4">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Transactions</option>
                  <option value="credit">Money Added</option>
                  <option value="debit">Money Spent</option>
                  <option value="failed">Failed</option>
                </select>
                <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Showing {filteredTransactions.length} transactions</span>
              <span>•</span>
              <span>Last updated: {new Date().toLocaleString()}</span>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map(transaction => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        transaction.type === 'credit' ? 'bg-green-100' : 
                        transaction.status === 'failed' ? 'bg-red-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'credit' ? (
                          <ArrowUpRight className={`w-6 h-6 ${
                            transaction.status === 'failed' ? 'text-red-600' : 'text-green-600'
                          }`} />
                        ) : (
                          <ArrowDownLeft className={`w-6 h-6 ${
                            transaction.status === 'failed' ? 'text-red-600' : 'text-red-600'
                          }`} />
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {transaction.note}
                        </h4>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString()} at{' '}
                            {new Date(transaction.createdAt).toLocaleTimeString()}
                          </p>
                          <span className="text-xs text-gray-400">•</span>
                          <p className="text-xs text-gray-500 uppercase">
                            {transaction.transactionId}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        transaction.type === 'credit' && transaction.status === 'completed' ? 'text-green-600' :
                        transaction.status === 'failed' ? 'text-red-600' :
                        'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {transaction.status === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : transaction.status === 'failed' ? (
                          <X className="w-4 h-4 text-red-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-500" />
                        )}
                        <span className={`text-sm capitalize ${
                          transaction.status === 'completed' ? 'text-green-600' :
                          transaction.status === 'failed' ? 'text-red-600' :
                          'text-yellow-600'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction metadata */}
                  {transaction.metadata && (
                    <div className="mt-3 ml-16">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                          {transaction.metadata.subscriptionId && (
                            <div>
                              <span className="font-medium">Subscription:</span> {transaction.metadata.subscriptionId}
                            </div>
                          )}
                          {transaction.metadata.mealType && (
                            <div>
                              <span className="font-medium">Meal:</span> {transaction.metadata.mealType}
                            </div>
                          )}
                          {transaction.metadata.razorpayPaymentId && (
                            <div>
                              <span className="font-medium">Payment ID:</span> {transaction.metadata.razorpayPaymentId}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Method:</span> {transaction.method}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No transactions found
                </h3>
                <p className="text-gray-500 mb-4">
                  {selectedFilter === 'all' 
                    ? "You haven't made any transactions yet"
                    : `No ${selectedFilter} transactions found`
                  }
                </p>
                {selectedFilter === 'all' && (
                  <button
                    onClick={() => setShowAddMoneyModal(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Money to Get Started
                  </button>
                )}
              </div>
            )}
          </div>

          {filteredTransactions.length > 0 && (
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {Math.min(20, filteredTransactions.length)} of {filteredTransactions.length} transactions
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50">
                    Previous
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Money Modal */}
      {showAddMoneyModal && <AddMoneyModal />}
    </div>
  );
};

export default WalletManagement;