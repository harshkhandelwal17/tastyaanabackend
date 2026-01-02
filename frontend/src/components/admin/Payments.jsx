import React, { useState } from 'react';

// Inline SVG Icons
const SearchIcon = ({ size = 20, className = 'text-gray-400' }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.5L20.5 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" />
    </svg>
);
const SortAscIcon = ({ size = 20, className = 'text-gray-400' }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5.83L15.17 8.99L16.58 7.58L12 3L7.41 7.58L8.82 8.99L12 5.83ZM12 18.17L8.83 15.01L7.42 16.42L12 21L16.59 16.42L15.18 15.01L12 18.17Z" />
    </svg>
);
const SortDescIcon = ({ size = 20, className = 'text-gray-400' }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 18.17L8.83 15.01L7.42 16.42L12 21L16.59 16.42L15.18 15.01L12 18.17ZM12 5.83L15.17 8.99L16.58 7.58L12 3L7.41 7.58L8.82 8.99L12 5.83Z" />
    </svg>
);
const CheckIcon = ({ size = 20, className = 'text-green-600' }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.285 2L9 13.4071L3.715 8.1221L2 9.8371L9 16.8371L22 3.715L20.285 2Z" />
    </svg>
);
const RefreshIcon = ({ size = 20, className = 'text-gray-600' }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4V1L8 5L12 9V6C15.31 6 18 8.69 18 12C18 15.31 15.31 18 12 18C8.69 18 6 15.31 6 12H4C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4Z" />
    </svg>
);
const UserIcon = ({ size = 24, className = 'text-gray-400' }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4ZM12 14C8.67 14 5.8 15.65 4 18.06V20H20V18.06C18.2 15.65 15.33 14 12 14Z" />
    </svg>
);
const StoreIcon = ({ size = 24, className = 'text-gray-400' }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V6H20V18ZM15 14H9V16H15V14ZM15 10H9V12H15V10Z" />
    </svg>
);

// Mock Data
const mockTransactions = [
    { orderId: 'ORD_12345', user: 'Arjun Sharma', vendor: 'Fresh Bites Co.', amount: 150.00, status: 'paid', mode: 'Card', date: '2025-09-08' },
    { orderId: 'ORD_67890', user: 'Priya Singh', vendor: 'Tasteful Foods Inc.', amount: 75.50, status: 'pending', mode: 'UPI', date: '2025-09-07' },
    { orderId: 'ORD_11223', user: 'Rahul Kumar', vendor: 'Fresh Bites Co.', amount: 200.00, status: 'paid', mode: 'COD', date: '2025-09-06' },
    { orderId: 'ORD_44556', user: 'Sneha Gupta', vendor: 'Tasteful Foods Inc.', amount: 95.75, status: 'paid', mode: 'Card', date: '2025-09-05' },
];

const mockVendorSettlements = [
    { vendor: 'Fresh Bites Co.', totalRevenue: 350.00, commissions: 35.00, payoutStatus: 'Paid' },
    { vendor: 'Tasteful Foods Inc.', totalRevenue: 171.25, commissions: 17.13, payoutStatus: 'Pending' },
];

const mockRefunds = [
    { refundId: 'REF_555', orderId: 'ORD_12345', user: 'Arjun Sharma', amount: 15.00, reason: 'Incorrect item delivered', status: 'Pending' },
    { refundId: 'REF_666', orderId: 'ORD_44556', user: 'Sneha Gupta', amount: 20.00, reason: 'Food quality issue', status: 'Processed' },
];

const Payments = () => {
    const [activeTab, setActiveTab] = useState('transactions');
    const [transactions, setTransactions] = useState(mockTransactions);
    const [vendorSettlements, setVendorSettlements] = useState(mockVendorSettlements);
    const [refunds, setRefunds] = useState(mockRefunds);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    // Filter and sort transactions
    const sortedTransactions = [...transactions].sort((a, b) => {
        if (sortConfig.key === null) return 0;
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
    });

    const filteredTransactions = sortedTransactions.filter(tx =>
        Object.values(tx).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleProcessRefund = (refundId) => {
        setRefunds(prevRefunds =>
            prevRefunds.map(refund =>
                refund.refundId === refundId ? { ...refund, status: 'Processed' } : refund
            )
        );
    };

    // Helper to get sorting icon
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <SortAscIcon className="opacity-20" />;
        return sortConfig.direction === 'ascending' ? <SortAscIcon /> : <SortDescIcon />;
    };

    const renderTable = () => {
        switch (activeTab) {
            case 'transactions':
                return (
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Transactions</h2>
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search transactions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-64 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {['Order ID', 'User', 'Vendor', 'Amount', 'Payment Status', 'Mode'].map((header) => (
                                            <th
                                                key={header}
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                                onClick={() => handleSort(header.toLowerCase().replace(' ', ''))}
                                            >
                                                <div className="flex items-center">
                                                    {header}
                                                    {getSortIcon(header.toLowerCase().replace(' ', ''))}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredTransactions.map((tx) => (
                                        <tr key={tx.orderId} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.orderId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.user}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.vendor}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${tx.amount.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.mode}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredTransactions.length === 0 && (
                                <p className="text-center text-gray-500 py-4">No transactions found.</p>
                            )}
                        </div>
                    </div>
                );
            case 'settlements':
                return (
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Vendor Settlements</h2>
                            <button
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                            >
                                <RefreshIcon className="text-white" />
                                Generate Report
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {vendorSettlements.map((settlement) => (
                                <div key={settlement.vendor} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                    <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-2">
                                        <StoreIcon size={20} />
                                        {settlement.vendor}
                                    </h3>
                                    <p className="text-sm text-gray-600">Total Revenue: <span className="font-semibold text-gray-800">${settlement.totalRevenue.toFixed(2)}</span></p>
                                    <p className="text-sm text-gray-600 mt-1">Commissions: <span className="font-semibold text-gray-800">${settlement.commissions.toFixed(2)}</span></p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Payout Status:
                                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${settlement.payoutStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {settlement.payoutStatus}
                                        </span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'refunds':
                return (
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Refunds</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Refund ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {refunds.map((refund) => (
                                        <tr key={refund.refundId} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{refund.refundId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{refund.orderId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{refund.user}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${refund.amount.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{refund.reason}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${refund.status === 'Processed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {refund.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {refund.status === 'Pending' && (
                                                    <button
                                                        onClick={() => handleProcessRefund(refund.refundId)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        <CheckIcon size={20} className="inline-block mr-1" />
                                                        Process
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {refunds.length === 0 && (
                                <p className="text-center text-gray-500 py-4">No refund requests.</p>
                            )}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen p-4 sm:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Payment Dashboard</h1>
                
                <div className="flex flex-col sm:flex-row mb-6 bg-white p-2 rounded-full shadow-md">
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`flex-1 px-4 py-2 rounded-full font-medium transition-all ${activeTab === 'transactions' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        Transactions
                    </button>
                    <button
                        onClick={() => setActiveTab('settlements')}
                        className={`flex-1 px-4 py-2 rounded-full font-medium transition-all ${activeTab === 'settlements' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        Vendor Settlements
                    </button>
                    <button
                        onClick={() => setActiveTab('refunds')}
                        className={`flex-1 px-4 py-2 rounded-full font-medium transition-all ${activeTab === 'refunds' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        Refunds
                    </button>
                </div>
                
                {renderTable()}
            </div>
        </div>
    );
};

export default Payments;