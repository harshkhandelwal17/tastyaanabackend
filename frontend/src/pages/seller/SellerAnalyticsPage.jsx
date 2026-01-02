
// import React, { useState, useEffect } from 'react';
// import { 
//   TrendingUp,
//   TrendingDown,
//   Users,
//   ShoppingCart,
//   DollarSign,
//   Eye,
//   Star,
//   Calendar,
//   Download,
//   Filter,
//   BarChart3,
//   PieChart,
//   Activity,
//   ArrowUpRight,
//   ArrowDownRight,
// } from 'lucide-react';
// import SellerLayout from '../../components/seller/SellerLayout';

// const SellerAnalyticsPage = () => {
//   const [dateRange, setDateRange] = useState('7d');
//   const [loading, setLoading] = useState(false);

//   const [analyticsData, setAnalyticsData] = useState({
//     overview: {
//       totalRevenue: 125000,
//       totalOrders: 342,
//       totalCustomers: 89,
//       avgOrderValue: 365,
//       revenueChange: 12.5,
//       ordersChange: -2.3,
//       customersChange: 8.7,
//       avgOrderChange: 15.2
//     },
//     topProducts: [
//       { name: 'Chicken Biryani', sales: 145, revenue: 36250, growth: 12.5 },
//       { name: 'Vegetable Thali', sales: 98, revenue: 17640, growth: -3.2 },
//       { name: 'Masala Dosa', sales: 87, revenue: 10440, growth: 8.9 },
//       { name: 'Paneer Butter Masala', sales: 76, revenue: 16720, growth: 22.1 },
//       { name: 'Gulab Jamun', sales: 123, revenue: 9840, growth: 5.4 }
//     ],
//     dailyStats: [
//       { date: '2024-01-15', orders: 24, revenue: 5200, customers: 18 },
//       { date: '2024-01-14', orders: 19, revenue: 4100, customers: 15 },
//       { date: '2024-01-13', orders: 31, revenue: 6800, customers: 24 },
//       { date: '2024-01-12', orders: 27, revenue: 5900, customers: 21 },
//       { date: '2024-01-11', orders: 22, revenue: 4700, customers: 17 },
//       { date: '2024-01-10', orders: 29, revenue: 6300, customers: 23 },
//       { date: '2024-01-09', orders: 25, revenue: 5400, customers: 19 }
//     ],
//     customerInsights: {
//       newCustomers: 12,
//       returningCustomers: 77,
//       customerRetention: 86.5,
//       avgCustomerLifetime: 245
//     },
//     orderInsights: {
//       pendingOrders: 8,
//       completedOrders: 334,
//       cancelledOrders: 6,
//       avgDeliveryTime: 42
//     }
//   });

//   const formatCurrency = (amount) => {
//     return `₹${amount.toLocaleString('en-IN')}`;
//   };

//   const formatPercentage = (value) => {
//     return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString('en-IN', {
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   const MetricCard = ({ title, value, change, icon: Icon, color, subtitle }) => (
//     <div className="bg-white overflow-hidden shadow rounded-lg">
//       <div className="p-5">
//         <div className="flex items-center">
//           <div className="flex-shrink-0">
//             <div className={`rounded-md p-3 ${color}`}>
//               <Icon className="h-6 w-6" />
//             </div>
//           </div>
//           <div className="ml-5 w-0 flex-1">
//             <dl>
//               <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
//               <dd className="flex items-baseline">
//                 <div className="text-2xl font-semibold text-gray-900">{value}</div>
//                 {change !== undefined && (
//                   <div className={`ml-2 flex items-baseline text-sm font-semibold ${
//                     change >= 0 ? 'text-green-600' : 'text-red-600'
//                   }`}>
//                     {change >= 0 ? (
//                       <ArrowUpRight className="self-center flex-shrink-0 h-4 w-4" />
//                     ) : (
//                       <ArrowDownRight className="self-center flex-shrink-0 h-4 w-4" />
//                     )}
//                     <span className="ml-1">{formatPercentage(change)}</span>
//                   </div>
//                 )}
//               </dd>
//               {subtitle && (
//                 <dd className="text-sm text-gray-500 mt-1">{subtitle}</dd>
//               )}
//             </dl>
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   const SimpleChart = ({ data, title, color = 'blue' }) => (
//     <div className="bg-white shadow rounded-lg p-6">
//       <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
//       <div className="space-y-3">
//         {data.map((item, index) => {
//           const maxValue = Math.max(...data.map(d => d.value));
//           const percentage = (item.value / maxValue) * 100;
          
//           return (
//             <div key={index} className="flex items-center">
//               <div className="w-20 text-sm text-gray-600">{item.label}</div>
//               <div className="flex-1 mx-3">
//                 <div className="bg-gray-200 rounded-full h-2">
//                   <div 
//                     className={`bg-${color}-500 h-2 rounded-full transition-all duration-300`}
//                     style={{ width: `${percentage}%` }}
//                   ></div>
//                 </div>
//               </div>
//               <div className="w-16 text-sm font-medium text-gray-900 text-right">
//                 {typeof item.value === 'number' && item.value > 1000 ? formatCurrency(item.value) : item.value}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );

//   const TopProductCard = ({ product, rank }) => (
//     <div className="flex items-center p-4 bg-gray-50 rounded-lg">
//       <div className="flex-shrink-0">
//         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
//           rank === 1 ? 'bg-yellow-100 text-yellow-800' :
//           rank === 2 ? 'bg-gray-100 text-gray-800' :
//           rank === 3 ? 'bg-orange-100 text-orange-800' :
//           'bg-blue-100 text-blue-800'
//         }`}>
//           #{rank}
//         </div>
//       </div>
//       <div className="ml-3 flex-1 min-w-0">
//         <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
//         <p className="text-sm text-gray-500">{product.sales} sales • {formatCurrency(product.revenue)}</p>
//       </div>
//       <div className={`flex items-center text-sm font-medium ${
//         product.growth >= 0 ? 'text-green-600' : 'text-red-600'
//       }`}>
//         {product.growth >= 0 ? (
//           <TrendingUp className="h-4 w-4 mr-1" />
//         ) : (
//           <TrendingDown className="h-4 w-4 mr-1" />
//         )}
//         {formatPercentage(product.growth)}
//       </div>
//     </div>
//   );

//   const mockChartData = {
//     revenue: analyticsData.dailyStats.map(stat => ({
//       label: formatDate(stat.date),
//       value: stat.revenue
//     })),
//     orders: analyticsData.dailyStats.map(stat => ({
//       label: formatDate(stat.date),
//       value: stat.orders
//     }))
//   };

//   return (
//     <SellerLayout>
//       <div className="space-y-6">
//         {/* Header */}
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
//             <p className="mt-1 text-sm text-gray-600">
//               Track your business performance and insights
//             </p>
//           </div>
//           <div className="mt-4 sm:mt-0 flex items-center space-x-3">
//             <select
//               value={dateRange}
//               onChange={(e) => setDateRange(e.target.value)}
//               className="block w-32 pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
//             >
//               <option value="7d">Last 7 days</option>
//               <option value="30d">Last 30 days</option>
//               <option value="90d">Last 90 days</option>
//               <option value="1y">Last year</option>
//             </select>
//             <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
//               <Download className="h-4 w-4 mr-2" />
//               Export
//             </button>
//           </div>
//         </div>

//         {/* Key Metrics */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           <MetricCard
//             title="Total Revenue"
//             value={formatCurrency(analyticsData.overview.totalRevenue)}
//             change={analyticsData.overview.revenueChange}
//             icon={DollarSign}
//             color="bg-green-100 text-green-600"
//             subtitle="vs previous period"
//           />
//           <MetricCard
//             title="Total Orders"
//             value={analyticsData.overview.totalOrders}
//             change={analyticsData.overview.ordersChange}
//             icon={ShoppingCart}
//             color="bg-blue-100 text-blue-600"
//             subtitle="vs previous period"
//           />
//           <MetricCard
//             title="Total Customers"
//             value={analyticsData.overview.totalCustomers}
//             change={analyticsData.overview.customersChange}
//             icon={Users}
//             color="bg-purple-100 text-purple-600"
//             subtitle="unique customers"
//           />
//           <MetricCard
//             title="Avg Order Value"
//             value={formatCurrency(analyticsData.overview.avgOrderValue)}
//             change={analyticsData.overview.avgOrderChange}
//             icon={TrendingUp}
//             color="bg-orange-100 text-orange-600"
//             subtitle="per order"
//           />
//         </div>

//         {/* Charts Section */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <SimpleChart 
//             data={mockChartData.revenue.reverse()} 
//             title="Daily Revenue Trend" 
//             color="green"
//           />
//           <SimpleChart 
//             data={mockChartData.orders.reverse()} 
//             title="Daily Orders Trend" 
//             color="blue"
//           />
//         </div>

//         {/* Top Products & Customer Insights */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* Top Products */}
//           <div className="bg-white shadow rounded-lg">
//             <div className="px-6 py-4 border-b border-gray-200">
//               <div className="flex items-center justify-between">
//                 <h3 className="text-lg font-medium text-gray-900">Top Products</h3>
//                 <button className="text-sm text-blue-600 hover:text-blue-500 font-medium">
//                   View all
//                 </button>
//               </div>
//             </div>
//             <div className="p-6 space-y-4">
//               {analyticsData.topProducts.map((product, index) => (
//                 <TopProductCard key={index} product={product} rank={index + 1} />
//               ))}
//             </div>
//           </div>

//           {/* Customer & Order Insights */}
//           <div className="space-y-6">
//             {/* Customer Insights */}
//             <div className="bg-white shadow rounded-lg p-6">
//               <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Insights</h3>
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="text-center p-4 bg-blue-50 rounded-lg">
//                   <div className="text-2xl font-bold text-blue-600">
//                     {analyticsData.customerInsights.newCustomers}
//                   </div>
//                   <div className="text-sm text-gray-600">New Customers</div>
//                 </div>
//                 <div className="text-center p-4 bg-green-50 rounded-lg">
//                   <div className="text-2xl font-bold text-green-600">
//                     {analyticsData.customerInsights.returningCustomers}
//                   </div>
//                   <div className="text-sm text-gray-600">Returning</div>
//                 </div>
//                 <div className="text-center p-4 bg-purple-50 rounded-lg">
//                   <div className="text-2xl font-bold text-purple-600">
//                     {analyticsData.customerInsights.customerRetention}%
//                   </div>
//                   <div className="text-sm text-gray-600">Retention Rate</div>
//                 </div>
//                 <div className="text-center p-4 bg-orange-50 rounded-lg">
//                   <div className="text-2xl font-bold text-orange-600">
//                     {formatCurrency(analyticsData.customerInsights.avgCustomerLifetime)}
//                   </div>
//                   <div className="text-sm text-gray-600">Avg. Lifetime</div>
//                 </div>
//               </div>
//             </div>

//             {/* Order Status Distribution */}
//             <div className="bg-white shadow rounded-lg p-6">
//               <h3 className="text-lg font-medium text-gray-900 mb-4">Order Status</h3>
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-600">Completed Orders</span>
//                   <span className="text-sm font-medium text-green-600">
//                     {analyticsData.orderInsights.completedOrders}
//                   </span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-600">Pending Orders</span>
//                   <span className="text-sm font-medium text-yellow-600">
//                     {analyticsData.orderInsights.pendingOrders}
//                   </span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-gray-600">Cancelled Orders</span>
//                   <span className="text-sm font-medium text-red-600">
//                     {analyticsData.orderInsights.cancelledOrders}
//                   </span>
//                 </div>
//                 <div className="pt-3 border-t border-gray-200">
//                   <div className="flex items-center justify-between">
//                     <span className="text-sm text-gray-600">Avg. Delivery Time</span>
//                     <span className="text-sm font-medium text-blue-600">
//                       {analyticsData.orderInsights.avgDeliveryTime} mins
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Performance Summary */}
//         <div className="bg-white shadow rounded-lg p-6">
//           <h3 className="text-lg font-medium text-gray-900 mb-6">Performance Summary</h3>
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//             <div className="text-center">
//               <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-green-100 rounded-lg">
//                 <TrendingUp className="h-6 w-6 text-green-600" />
//               </div>
//               <div className="text-sm text-gray-600">Revenue Growth</div>
//               <div className="text-lg font-semibold text-gray-900">
//                 {formatPercentage(analyticsData.overview.revenueChange)}
//               </div>
//             </div>
//             <div className="text-center">
//               <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-lg">
//                 <Users className="h-6 w-6 text-blue-600" />
//               </div>
//               <div className="text-sm text-gray-600">Customer Growth</div>
//               <div className="text-lg font-semibold text-gray-900">
//                 {formatPercentage(analyticsData.overview.customersChange)}
//               </div>
//             </div>
//             <div className="text-center">
//               <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-lg">
//                 <Star className="h-6 w-6 text-purple-600" />
//               </div>
//               <div className="text-sm text-gray-600">Customer Satisfaction</div>
//               <div className="text-lg font-semibold text-gray-900">92%</div>
//             </div>
//             <div className="text-center">
//               <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-orange-100 rounded-lg">
//                 <Activity className="h-6 w-6 text-orange-600" />
//               </div>
//               <div className="text-sm text-gray-600">Order Efficiency</div>
//               <div className="text-lg font-semibold text-gray-900">95%</div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </SellerLayout>
//   );
// };

// export default SellerAnalyticsPage;

import React from 'react';
import SellerAnalyticsDashboard from '../../components/seller/SellerAnalyticsDashboard';
const SellerAnalyticsPage = () => {
  return <SellerAnalyticsDashboard />;
};

export default SellerAnalyticsPage;

