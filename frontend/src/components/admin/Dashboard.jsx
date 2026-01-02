import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingBag, Truck, DollarSign, Users, Settings, Phone, Package, HeartHandshake, Menu, X, Store, TrendingUp, TrendingDown, Plus, AlertCircle, Eye, ShoppingCart, Clock, Search, Bell, CheckCircle, XCircle, MoreHorizontal, Download, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// --- Professional UI Components ---

const OverviewCard = ({ title, value, icon: Icon, trend }) => {
    const isPositive = trend > 0;
    const trendValue = Math.abs(trend);

    return (
        <div className="bg-white rounded-lg p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-sky-100 rounded-lg">
                    <Icon className="w-6 h-6 text-sky-600" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-teal-600' : 'text-rose-600'}`}>
                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span>{trendValue}%</span>
                </div>
            </div>
            <div>
                <p className="text-3xl font-bold text-slate-800">{value}</p>
                <p className="text-sm text-slate-500 mt-1">{title}</p>
            </div>
        </div>
    );
};

const QuickActionButton = ({ title, icon: Icon, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors duration-200"
    >
        <Icon className="w-5 h-5 text-slate-500" />
        <span>{title}</span>
    </button>
);

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-xl p-6 w-full max-w-md relative z-10 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

// --- Main Dashboard Component with Month Filtering ---

const Dashboard = () => {
    const [timeRange, setTimeRange] = useState('weekly');
    const [isLoading, setIsLoading] = useState(false);
    const [activeModal, setActiveModal] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMetric, setSelectedMetric] = useState('orders');
    const [selectedMonth, setSelectedMonth] = useState('January'); // State for month filter
    const [dashboardData, setDashboardData] = useState({});

    // Mock data for each month
    const mockMonthlyData = {
        'January': {
            overview: {
                totalOrders: { value: 1247, trend: 12.5 },
                activeVendors: { value: 89, trend: 5.2 },
                registeredUsers: { value: 15623, trend: 18.7 },
                revenue: { value: 234567.89, trend: -2.1 }
            },
            ordersData: [
                { date: 'Week 1', orders: 145, revenue: 12340, users: 89 },
                { date: 'Week 2', orders: 152, revenue: 15780, users: 94 },
                { date: 'Week 3', orders: 138, revenue: 11960, users: 87 },
                { date: 'Week 4', orders: 167, revenue: 18450, users: 102 },
            ],
            categoriesData: [
                { name: 'Electronics', value: 35, color: '#38bdf8' },
                { name: 'Clothing', value: 28, color: '#34d399' },
                { name: 'Home & Garden', value: 18, color: '#fbbf24' },
                { name: 'Books', value: 12, color: '#a78bfa' },
                { name: 'Sports', value: 7, color: '#f87171' }
            ],
            recentOrders: [
                { id: '#ORD-001', customer: 'John Doe', amount: 299.99, status: 'delivered', time: 'Jan 28' },
                { id: '#ORD-002', customer: 'Jane Smith', amount: 159.50, status: 'processing', time: 'Jan 27' },
                { id: '#ORD-003', customer: 'Mike Johnson', amount: 89.99, status: 'shipped', time: 'Jan 26' },
                { id: '#ORD-004', customer: 'Sarah Wilson', amount: 199.00, status: 'pending', time: 'Jan 25' }
            ]
        },
        'February': {
            overview: {
                totalOrders: { value: 1100, trend: -5.5 },
                activeVendors: { value: 92, trend: 3.4 },
                registeredUsers: { value: 16000, trend: 2.4 },
                revenue: { value: 210000.50, trend: -10.5 }
            },
            ordersData: [
                { date: 'Week 1', orders: 130, revenue: 11000, users: 85 },
                { date: 'Week 2', orders: 140, revenue: 12000, users: 90 },
                { date: 'Week 3', orders: 125, revenue: 10500, users: 80 },
                { date: 'Week 4', orders: 155, revenue: 13000, users: 95 },
            ],
            categoriesData: [
                { name: 'Electronics', value: 30, color: '#38bdf8' },
                { name: 'Clothing', value: 35, color: '#34d399' },
                { name: 'Home & Garden', value: 20, color: '#fbbf24' },
                { name: 'Books', value: 10, color: '#a78bfa' },
                { name: 'Sports', value: 5, color: '#f87171' }
            ],
            recentOrders: [
                { id: '#ORD-005', customer: 'David Lee', amount: 350.00, status: 'delivered', time: 'Feb 26' },
                { id: '#ORD-006', customer: 'Emily Chen', amount: 75.25, status: 'shipped', time: 'Feb 25' },
                { id: '#ORD-007', customer: 'Tom Hardy', amount: 25.00, status: 'processing', time: 'Feb 24' },
                { id: '#ORD-008', customer: 'Alice Wong', amount: 500.00, status: 'delivered', time: 'Feb 23' }
            ]
        },
    };

    // Set initial data on component mount
    useEffect(() => {
        setDashboardData(mockMonthlyData[selectedMonth]);
    }, [selectedMonth]);

    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
    const formatNumber = (num) => {
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const refreshData = () => {
        setIsLoading(true);
        setTimeout(() => {
            setDashboardData(mockMonthlyData[selectedMonth]);
            setIsLoading(false);
        }, 1500);
    };

    const getStatusBadgeStyle = (status) => {
        const styles = {
            delivered: 'bg-teal-50 text-teal-700',
            processing: 'bg-amber-50 text-amber-700',
            shipped: 'bg-sky-50 text-sky-700',
            pending: 'bg-slate-100 text-slate-700',
        };
        return styles[status] || styles.pending;
    };
    
    // Check if data is loaded
    if (!dashboardData.overview) {
        return <div className="p-6 text-center text-gray-500">Loading data...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            {/* --- Header --- */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-bold text-slate-800">Analytics Dashboard</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative hidden md:block">
                                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text" placeholder="Search..."
                                    className="pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button onClick={refreshData} disabled={isLoading} className="p-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50">
                                <RefreshCw className={`w-5 h-5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                            <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors" onClick={() => console.log('Notifications button clicked.')}>
                                <Bell className="w-5 h-5 text-slate-500" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-sky-500 rounded-full"></span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- Main Content --- */}
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                {/* --- Overview Section --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <OverviewCard title="Total Revenue" value={formatCurrency(dashboardData.overview.revenue.value)} icon={DollarSign} trend={dashboardData.overview.revenue.trend} />
                    <OverviewCard title="Total Orders" value={formatNumber(dashboardData.overview.totalOrders.value)} icon={ShoppingBag} trend={dashboardData.overview.totalOrders.trend} />
                    <OverviewCard title="Active Vendors" value={dashboardData.overview.activeVendors.value} icon={Store} trend={dashboardData.overview.activeVendors.trend} />
                    <OverviewCard title="Registered Users" value={formatNumber(dashboardData.overview.registeredUsers.value)} icon={Users} trend={dashboardData.overview.registeredUsers.trend} />
                </div>

                {/* --- Charts Section --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Performance Overview Chart */}
                    <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-slate-200/80 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Performance Overview</h3>
                                <p className="text-slate-500 text-sm">Track key metrics over the selected period</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                {/* Month filter dropdown */}
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                                >
                                    {Object.keys(mockMonthlyData).map(month => (
                                        <option key={month} value={month}>{month}</option>
                                    ))}
                                </select>
                                {/* Metric filter buttons */}
                                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                                    {['orders', 'revenue', 'users'].map((metric) => (
                                        <button key={metric} onClick={() => setSelectedMetric(metric)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${selectedMetric === metric ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                            {metric.charAt(0).toUpperCase() + metric.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={dashboardData.ordersData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey={selectedMetric} stroke="#0ea5e9" strokeWidth={2.5} fill="url(#colorGradient)" dot={{ r: 5, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 7, stroke: '#0ea5e9', fill: '#fff' }}/>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Quick Actions & Delivery Status */}
                    <div className="space-y-8">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg p-6 border border-slate-200/80 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800">Quick Actions</h3>
                            <div className="space-y-3">
                                <QuickActionButton title="Add New Product" icon={Plus} onClick={() => setActiveModal('addProduct')} />
                                <QuickActionButton title="Generate Report" icon={Download} onClick={() => console.log('Generate Report button clicked.')} />
                                <QuickActionButton title="View Issues" icon={AlertCircle} onClick={() => console.log('View Issues button clicked.')} />
                            </div>
                        </div>

                        {/* Sales by Category */}
                        <div className="bg-white rounded-lg p-6 border border-slate-200/80 shadow-sm">
                           <h3 className="text-lg font-bold text-slate-800 mb-4">Sales by Category</h3>
                           <div className="flex items-center justify-center -mt-4">
                               <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie data={dashboardData.categoriesData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} >
                                            {dashboardData.categoriesData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                               </ResponsiveContainer>
                           </div>
                           <div className="space-y-2 mt-2">
                               {dashboardData.categoriesData.map(cat => (
                                   <div key={cat.name} className="flex items-center justify-between text-sm">
                                       <div className="flex items-center gap-2">
                                           <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                                           <span className="text-slate-600">{cat.name}</span>
                                       </div>
                                       <span className="font-semibold text-slate-800">{cat.value}%</span>
                                   </div>
                               ))}
                           </div>
                        </div>
                    </div>
                </div>

                {/* --- Recent Orders Table --- */}
                <div className="bg-white rounded-lg p-6 border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Recent Orders</h3>
                        <button className="text-sm font-semibold text-sky-600 hover:text-sky-700" onClick={() => console.log('View All button clicked.')}>View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-200">
                                    <th className="p-3 font-medium">Order ID</th>
                                    <th className="p-3 font-medium">Customer</th>
                                    <th className="p-3 font-medium">Amount</th>
                                    <th className="p-3 font-medium">Status</th>
                                    <th className="p-3 font-medium hidden sm:table-cell">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboardData.recentOrders.map((order) => (
                                    <tr key={order.id} className="border-b border-slate-200/80 hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-sky-600">{order.id}</td>
                                        <td className="p-3 text-slate-600">{order.customer}</td>
                                        <td className="p-3 font-medium text-slate-800">{formatCurrency(order.amount)}</td>
                                        <td className="p-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeStyle(order.status)}`}>
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="p-3 text-slate-500 hidden sm:table-cell">{order.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* --- Add Product Modal --- */}
            <Modal isOpen={activeModal === 'addProduct'} onClose={() => setActiveModal(null)} title="Add New Product">
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); console.log('Form submitted!'); setActiveModal(null); }}>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Product Name</label>
                        <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition" placeholder="e.g., Wireless Headphones" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
                        <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition">
                            <option>Electronics</option><option>Clothing</option><option>Home & Garden</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Price</label>
                        <input type="number" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition" placeholder="0.00" />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setActiveModal(null)} className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold transition-colors">Cancel</button>
                        <button type="submit" className="flex-1 px-4 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold transition-colors">Add Product</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Dashboard;