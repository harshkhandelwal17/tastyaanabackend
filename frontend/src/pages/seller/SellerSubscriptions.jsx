// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Box,
//   Typography,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   TablePagination,
//   Button,
//   Chip,
//   CircularProgress,
//   Grid,
//   Card,
//   CardContent,
//   Divider,
//   IconButton,
//   Tooltip,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
// } from "@mui/material";
// import {
//   Visibility as ViewIcon,
//   Edit as EditIcon,
//   Delete as DeleteIcon,
//   CalendarToday as CalendarIcon,
//   LocalShipping as DeliveryIcon,
//   Receipt as ReceiptIcon,
//   Person as PersonIcon,
//   Restaurant as MealIcon,
//   AccessTime as TimeIcon,
//   Refresh as RefreshIcon,
// } from "@mui/icons-material";
// import { format } from "date-fns";
// import { toast } from "react-toastify";
// import {
//   useGetSellerSubscriptionsQuery,
//   useGetSellerSubscriptionStatsQuery,
//   useUpdateSellerSubscriptionMutation,
// } from "../../features/api/sellerApi";

// // Status chip component
// const StatusChip = ({ status }) => {
//   const statusColors = {
//     active: "success",
//     paused: "warning",
//     cancelled: "error",
//     completed: "info",
//     pending: "default",
//   };

//   return (
//     <Chip
//       label={status.charAt(0).toUpperCase() + status.slice(1)}
//       color={statusColors[status] || "default"}
//       size="small"
//     />
//   );
// };

// // Stats card component
// const StatCard = ({ title, value, icon: Icon, color }) => (
//   <Card>
//     <CardContent>
//       <Box display="flex" alignItems="center" justifyContent="space-between">
//         <Box>
//           <Typography variant="h6" color="textSecondary" gutterBottom>
//             {title}
//           </Typography>
//           <Typography variant="h4">{value}</Typography>
//         </Box>
//         <Box
//           sx={{
//             backgroundColor: `${color}.light`,
//             color: `${color}.dark`,
//             borderRadius: "50%",
//             width: 56,
//             height: 56,
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//           }}
//         >
//           <Icon fontSize="large" />
//         </Box>
//       </Box>
//     </CardContent>
//   </Card>
// );

// const SellerSubscriptions = () => {
//   const [page, setPage] = useState(0);
//   const [rowsPerPage, setRowsPerPage] = useState(10);
//   const [statusFilter, setStatusFilter] = useState("all");

//   // RTK Query hooks
//   const {
//     data: subscriptionsData,
//     isLoading: isLoadingSubscriptions,
//     isError: isSubscriptionsError,
//     refetch: refetchSubscriptions,
//   } = useGetSellerSubscriptionsQuery({
//     page: page + 1, // API uses 1-based pagination
//     limit: rowsPerPage,
//     status: statusFilter !== "all" ? statusFilter : undefined,
//   });
//   console.log(subscriptionsData);
//   const {
//     data: statsData,
//     isLoading: isLoadingStats,
//     isError: isStatsError,
//     refetch: refetchStats,
//   } = useGetSellerSubscriptionStatsQuery();

//   const [updateSellerSubscription] = useUpdateSellerSubscriptionMutation();

//   // Group subscriptions by plan name
//   const groupSubscriptionsByPlan = (subscriptions = []) => {
//     const grouped = {};

//     subscriptions.forEach((sub) => {
//       const planName = sub.mealPlan?.name || "Uncategorized";
//       if (!grouped[planName]) {
//         grouped[planName] = [];
//       }
//       grouped[planName].push(sub);
//     });

//     return Object.entries(grouped).map(([planName, subscriptions]) => ({
//       planName,
//       subscriptions,
//       count: subscriptions.length,
//     }));
//   };

//   // Extract and group data
//   const subscriptions = subscriptionsData?.subscriptions || [];
//   const groupedSubscriptions = groupSubscriptionsByPlan(subscriptions);
//   const totalCount = subscriptionsData?.total || 0;
//   const stats = statsData?.data || {
//     total: 0,
//     active: 0,
//     paused: 0,
//     cancelled: 0,
//   };

//   const loading = isLoadingSubscriptions || isLoadingStats;

//   // Handle status filter change
//   const handleStatusFilterChange = (event) => {
//     setStatusFilter(event.target.value);
//     setPage(0); // Reset to first page when filter changes
//   };

//   const navigate = useNavigate();

//   // Handle page change
//   const handleChangePage = (event, newPage) => {
//     setPage(newPage);
//   };

//   // Handle rows per page change
//   const handleChangeRowsPerPage = (event) => {
//     setRowsPerPage(parseInt(event.target.value, 10));
//     setPage(0);
//   };

//   // Handle refresh
//   const handleRefresh = () => {
//     refetchSubscriptions();
//     refetchStats();
//   };

//   // Status chip component
//   const getStatusChip = (status) => <StatusChip status={status} />;

//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     return format(new Date(dateString), "MMM d, yyyy");
//   };

//   const handleViewDetails = (subscriptionId) => {
//     navigate(`/seller/subscriptions/${subscriptionId}`);
//   };

//   const handleEdit = (subscriptionId) => {
//     navigate(`/seller/subscriptions/${subscriptionId}/edit`);
//   };

//   const handlePauseSubscription = async (subscriptionId) => {
//     if (window.confirm("Are you sure you want to pause this subscription?")) {
//       try {
//         await updateSellerSubscription({
//           subscriptionId,
//           status: "paused",
//           pauseUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
//         }).unwrap();
//         toast.success("Subscription paused successfully");
//         refetchSubscriptions();
//       } catch (error) {
//         console.error("Error pausing subscription:", error);
//         toast.error(error.data?.message || "Failed to pause subscription");
//       }
//     }
//   };

//   const handleResumeSubscription = async (subscriptionId) => {
//     try {
//       await updateSellerSubscription({
//         subscriptionId,
//         status: "active",
//       }).unwrap();
//       toast.success("Subscription resumed successfully");
//       refetchSubscriptions();
//     } catch (error) {
//       console.error("Error resuming subscription:", error);
//       toast.error(error.data?.message || "Failed to resume subscription");
//     }
//   };

//   const handleCancelSubscription = async (subscriptionId) => {
//     if (
//       window.confirm(
//         "Are you sure you want to cancel this subscription? This action cannot be undone."
//       )
//     ) {
//       try {
//         await updateSellerSubscription({
//           subscriptionId,
//           status: "cancelled",
//           reason: "Cancelled by seller",
//         });
//         toast.success("Subscription cancelled successfully");
//         refetchSubscriptions();
//       } catch (error) {
//         console.error("Error cancelling subscription:", error);
//         toast.error("Failed to cancel subscription");
//       }
//     }
//   };

//   if (loading) {
//     return (
//       <Box
//         display="flex"
//         justifyContent="center"
//         alignItems="center"
//         minHeight="60vh"
//       >
//         <CircularProgress />
//       </Box>
//     );
//   }

//   if (isSubscriptionsError || isStatsError) {
//     return (
//       <Box textAlign="center" p={4}>
//         <Typography color="error" gutterBottom>
//           Error loading subscription data. Please try again.
//         </Typography>
//         <Button
//           variant="contained"
//           color="primary"
//           onClick={handleRefresh}
//           startIcon={<RefreshIcon />}
//         >
//           Retry
//         </Button>
//       </Box>
//     );
//   }

//   return (
//     <Box p={3}>
//       <Box
//         sx={{
//           mb: 4,
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <Box>
//           <Typography variant="h4" component="h1" gutterBottom>
//             Subscriptions
//           </Typography>
//           <Typography variant="body1" color="text.secondary">
//             Manage your meal plan subscriptions
//           </Typography>
//         </Box>
//         <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
//           <FormControl size="small" sx={{ minWidth: 180 }}>
//             <InputLabel id="status-filter-label">Filter by Status</InputLabel>
//             <Select
//               labelId="status-filter-label"
//               value={statusFilter}
//               label="Filter by Status"
//               onChange={handleStatusFilterChange}
//               disabled={loading}
//             >
//               <MenuItem value="all">All Subscriptions</MenuItem>
//               <MenuItem value="active">Active</MenuItem>
//               <MenuItem value="paused">Paused</MenuItem>
//               <MenuItem value="cancelled">Cancelled</MenuItem>
//             </Select>
//           </FormControl>
//           <Button
//             variant="outlined"
//             startIcon={<RefreshIcon />}
//             onClick={handleRefresh}
//             disabled={loading}
//           >
//             Refresh
//           </Button>
//         </Box>
//       </Box>

//       {/* Stats Cards */}
//       <Grid container spacing={3} sx={{ mb: 4 }}>
//         <Grid item xs={12} sm={6} md={3}>
//           <StatCard
//             title="Total Subscriptions"
//             value={stats.total}
//             icon={ReceiptIcon}
//             color="primary"
//           />
//         </Grid>
//         <Grid item xs={12} sm={6} md={3}>
//           <StatCard
//             title="Active"
//             value={stats.active}
//             icon={CalendarIcon}
//             color="success"
//           />
//         </Grid>
//         <Grid item xs={12} sm={6} md={3}>
//           <StatCard
//             title="Paused"
//             value={stats.paused}
//             icon={TimeIcon}
//             color="warning"
//           />
//         </Grid>
//         <Grid item xs={12} sm={6} md={3}>
//           <StatCard
//             title="Cancelled"
//             value={stats.cancelled}
//             icon={DeleteIcon}
//             color="error"
//           />
//         </Grid>
//       </Grid>

//       <Paper elevation={3}>
//         <TableContainer>
//           <Table>
//             <TableHead>
//               <TableRow>
//                 <TableCell>Customer</TableCell>
//                 <TableCell>Meal Plan</TableCell>
//                 <TableCell>Status</TableCell>
//                 <TableCell>Start Date</TableCell>
//                 <TableCell>Next Delivery</TableCell>
//                 <TableCell>Actions</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {groupedSubscriptions.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={6} align="center">
//                     No subscriptions found
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 groupedSubscriptions.map((group, groupIndex) => (
//                   <React.Fragment key={`plan-${groupIndex}`}>
//                     <TableRow className="bg-gray-50">
//                       <TableCell colSpan={6} className="!py-2 !font-bold">
//                         {group.planName} ({group.count}{" "}
//                         {group.count === 1 ? "User" : "Users"})
//                       </TableCell>
//                       {console.log(groupedSubscriptions)}
//                     </TableRow>
//                     {group.subscriptions.map((subscription, subIndex) => (
//                       <TableRow key={subscription._id} hover>
//                         <TableCell>
//                           <Box display="flex" alignItems="center">
//                             <PersonIcon color="action" sx={{ mr: 1 }} />
//                             <Box>
//                               <Typography variant="subtitle2">
//                                 {subscription.user?.name || "N/A"}
//                               </Typography>
//                               <Typography variant="body2" color="textSecondary">
//                                 {subscription.user?.email || ""}
//                               </Typography>
//                             </Box>
//                           </Box>
//                         </TableCell>
//                         <TableCell>
//                           <Typography variant="body2">
//                             {subscription.mealPlan?.name || "N/A"}
//                           </Typography>
//                           <Typography variant="body2" color="textSecondary">
//                             {subscription.planType} •{" "}
//                             {subscription.duration || "N/A"}
//                           </Typography>
//                         </TableCell>
//                         <TableCell>
//                           {getStatusChip(subscription.status)}
//                         </TableCell>
//                         <TableCell>
//                           {formatDate(subscription.startDate)}
//                         </TableCell>
//                         <TableCell>
//                           {formatDate(subscription.nextDeliveryDate) || "N/A"}
//                         </TableCell>
//                         <TableCell>
//                           <Box display="flex" gap={1}>
//                             <Tooltip title="View Details">
//                               <IconButton
//                                 size="small"
//                                 color="primary"
//                                 onClick={() =>
//                                   handleViewDetails(subscription._id)
//                                 }
//                               >
//                                 <ViewIcon fontSize="small" />
//                               </IconButton>
//                             </Tooltip>
//                             <Tooltip title="Edit">
//                               <IconButton
//                                 size="small"
//                                 color="info"
//                                 onClick={() => handleEdit(subscription._id)}
//                               >
//                                 <EditIcon fontSize="small" />
//                               </IconButton>
//                             </Tooltip>
//                             {subscription.status.toLowerCase() === "active" && (
//                               <Tooltip title="Pause Subscription">
//                                 <IconButton
//                                   size="small"
//                                   color="warning"
//                                   onClick={() =>
//                                     handlePauseSubscription(subscription._id)
//                                   }
//                                 >
//                                   <TimeIcon fontSize="small" />
//                                 </IconButton>
//                               </Tooltip>
//                             )}
//                             {subscription.status.toLowerCase() === "paused" && (
//                               <Tooltip title="Resume Subscription">
//                                 <IconButton
//                                   size="small"
//                                   color="success"
//                                   onClick={() =>
//                                     handleResumeSubscription(subscription._id)
//                                   }
//                                 >
//                                   <CalendarIcon fontSize="small" />
//                                 </IconButton>
//                               </Tooltip>
//                             )}
//                             {subscription.status.toLowerCase() !==
//                               "cancelled" && (
//                               <Tooltip title="Cancel Subscription">
//                                 <IconButton
//                                   size="small"
//                                   color="error"
//                                   onClick={() =>
//                                     handleCancelSubscription(subscription._id)
//                                   }
//                                 >
//                                   <DeleteIcon fontSize="small" />
//                                 </IconButton>
//                               </Tooltip>
//                             )}
//                           </Box>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </React.Fragment>
//                 ))
//               )}
//             </TableBody>
//           </Table>
//         </TableContainer>
//         <TablePagination
//           rowsPerPageOptions={[5, 10, 25, 50]}
//           component="div"
//           count={totalCount}
//           rowsPerPage={rowsPerPage}
//           page={page}
//           onPageChange={handleChangePage}
//           onRowsPerPageChange={handleChangeRowsPerPage}
//         />
//       </Paper>
//     </Box>
//   );
// };

// export default SellerSubscriptions;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Users,
  Calendar,
  Clock,
  Receipt,
  User,
  Utensils,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Edit,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Hash,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  useGetSellerSubscriptionsQuery,
  useGetSellerSubscriptionStatsQuery,
  useUpdateSellerSubscriptionMutation,
} from "../../features/api/sellerApi";

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
    paused: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Pause },
    cancelled: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
    completed: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
    pending: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
      <Icon className="w-4 h-4 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        {trend && (
          <div className="flex items-center mt-1">
            {trend > 0 ? (
              <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
            )}
            <span className={`text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(trend)}% from last month
            </span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

// Plan Type Helper
const getPlanTypeDisplay = (planType) => {
  const planTypeMap = {
    '30days_1': '30 Days - 1 Meal/Day',
    '30days_2': '30 Days - 2 Meals/Day',
    '30days_3': '30 Days - 3 Meals/Day',
    '10days_1': '10 Days - 1 Meal/Day',
    '10days_2': '10 Days - 2 Meals/Day',
    '10days_3': '10 Days - 3 Meals/Day',
    '7days_1': '7 Days - 1 Meal/Day',
    '7days_2': '7 Days - 2 Meals/Day',
    '7days_3': '7 Days - 3 Meals/Day',
    '15days_1': '15 Days - 1 Meal/Day',
    '15days_2': '15 Days - 2 Meals/Day',
    '15days_3': '15 Days - 3 Meals/Day',
    'monthly_1': 'Monthly - 1 Meal/Day',
    'monthly_2': 'Monthly - 2 Meals/Day',
    'monthly_3': 'Monthly - 3 Meals/Day',
    'weekly_1': 'Weekly - 1 Meal/Day',
    'weekly_2': 'Weekly - 2 Meals/Day',
    'weekly_3': 'Weekly - 3 Meals/Day'
  };
  
  return planTypeMap[planType] || planType;
};

// Subscription Card Component
const SubscriptionCard = ({ subscription, onViewDetails, onEdit, onPause, onResume, onCancel }) => {
  const [showActions, setShowActions] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <Hash className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {subscription.subscriptionId || subscription._id}
            </h3>
            <p className="text-sm text-gray-500">Subscription ID</p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
          
          {showActions && (
            <div className="absolute right-0 top-10 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-[160px]">
              <button
                onClick={() => {
                  onViewDetails(subscription._id);
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </button>
              <button
                onClick={() => {
                  onEdit(subscription._id);
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              {subscription.status === 'active' && (
                <button
                  onClick={() => {
                    onPause(subscription._id);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center text-yellow-600"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </button>
              )}
              {subscription.status === 'paused' && (
                <button
                  onClick={() => {
                    onResume(subscription._id);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center text-green-600"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </button>
              )}
              {/* {subscription.status !== 'cancelled' && (
                <button
                  onClick={() => {
                    onCancel(subscription._id);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center text-red-600"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              )} */}
            </div>
          )}
        </div>
      </div>

      {/* Plan Info */}
      <div className="flex items-center mb-3">
        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-2">
          <Utensils className="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {subscription.mealPlan?.planName || subscription.mealPlan?.title || subscription.mealPlan?.name || 'Unknown Plan'}
          </p>
          <p className="text-sm text-gray-500">
            {getPlanTypeDisplay(subscription.planType)} • {subscription.shift} shift
          </p>
        </div>
      </div>

      {/* Status and Progress */}
      <div className="flex items-center justify-between mb-3">
        <StatusBadge status={subscription.status} />
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">
            {formatCurrency(subscription.pricing?.finalAmount || 0)}
          </p>
          <p className="text-xs text-gray-500">Total Value</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{subscription.mealCounts?.mealsDelivered || 0} / {subscription.mealCounts?.totalMeals || 0} meals</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${subscription.mealCounts?.totalMeals ? (subscription.mealCounts.mealsDelivered / subscription.mealCounts.totalMeals) * 100 : 0}%` 
            }}
          ></div>
        </div>
      </div>

      {/* Meal Counts */}
      <div className="grid grid-cols-3 gap-3 text-sm mb-3">
        <div className="text-center">
          <p className="text-gray-500">Total</p>
          <p className="font-medium text-lg">{subscription.mealCounts?.totalMeals || 0}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Delivered</p>
          <p className="font-medium text-lg text-green-600">{subscription.mealCounts?.mealsDelivered || 0}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Remaining</p>
          <p className="font-medium text-lg text-blue-600">{subscription.mealCounts?.mealsRemaining || 0}</p>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">Start Date</p>
          <p className="font-medium">{formatDate(subscription.startDate)}</p>
        </div>
        <div>
          <p className="text-gray-500">Next Delivery</p>
          <p className="font-medium">{formatDate(subscription.nextDeliveryDate) || 'N/A'}</p>
        </div>
      </div>

      {/* Delivery Days */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-1">Delivery Days</p>
        <div className="flex flex-wrap gap-1">
          {subscription.deliverySettings?.deliveryDays?.map((day, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              {day.day.charAt(0).toUpperCase() + day.day.slice(1, 3)}
            </span>
          )) || (
            <span className="text-gray-400 text-xs">No delivery days set</span>
          )}
        </div>
      </div>
    </div>
  );
};

const SellerSubscriptions = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("cards"); // "cards" or "list"

  const navigate = useNavigate();

  // RTK Query hooks
  const {
    data: subscriptionsData,
    isLoading: isLoadingSubscriptions,
    isError: isSubscriptionsError,
    refetch: refetchSubscriptions,
  } = useGetSellerSubscriptionsQuery({
    page,
    limit: 20,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const {
    data: statsData,
    isLoading: isLoadingStats,
    isError: isStatsError,
    refetch: refetchStats,
  } = useGetSellerSubscriptionStatsQuery();

  const [updateSellerSubscription] = useUpdateSellerSubscriptionMutation();

  // Extract data
  const subscriptions = subscriptionsData?.subscriptions || [];
  const totalCount = subscriptionsData?.total || 0;
  const stats = statsData?.data || {
    total: 0,
    active: 0,
    paused: 0,
    cancelled: 0,
  };

  const loading = isLoadingSubscriptions || isLoadingStats;

  // Calculate analytics from subscriptions data
  const calculateAnalytics = () => {
    if (!subscriptions.length) return { total: 0, active: 0, paused: 0, cancelled: 0, totalRevenue: 0 };

    const analytics = subscriptions.reduce((acc, sub) => {
      acc.total++;
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      acc.totalRevenue += sub.pricing?.finalAmount || 0;
      return acc;
    }, { total: 0, totalRevenue: 0 });

    return {
      total: analytics.total,
      active: analytics.active || 0,
      paused: analytics.paused || 0,
      cancelled: analytics.cancelled || 0,
      totalRevenue: analytics.totalRevenue
    };
  };

  const calculatedStats = calculateAnalytics();

  // Filter subscriptions based on search term
  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.subscriptionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.mealPlan?.planName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.mealPlan?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.mealPlan?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle actions
  const handleViewDetails = (subscriptionId) => {
    navigate(`/seller/subscriptions/${subscriptionId}`);
  };

  const handleEdit = (subscriptionId) => {
    navigate(`/seller/subscriptions/${subscriptionId}/edit`);
  };

  const handlePauseSubscription = async (subscriptionId) => {
    if (window.confirm("Are you sure you want to pause this subscription?")) {
      try {
        await updateSellerSubscription({
          subscriptionId,
          status: "paused",
          pauseUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }).unwrap();
        toast.success("Subscription paused successfully", { duration: 2000 });
        refetchSubscriptions();
      } catch (error) {
        console.error("Error pausing subscription:", error);
        toast.error(error.data?.message || "Failed to pause subscription", { duration: 2000 });
      }
    }
  };

  const handleResumeSubscription = async (subscriptionId) => {
    try {
      await updateSellerSubscription({
        subscriptionId,
        status: "active",
      }).unwrap();
      toast.success("Subscription resumed successfully", { duration: 2000 });
      refetchSubscriptions();
    } catch (error) {
      console.error("Error resuming subscription:", error);
      toast.error(error.data?.message || "Failed to resume subscription", { duration: 2000 });
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    if (window.confirm("Are you sure you want to cancel this subscription? This action cannot be undone.")) {
      try {
        await updateSellerSubscription({
          subscriptionId,
          status: "cancelled",
          reason: "Cancelled by seller",
        });
        toast.success("Subscription cancelled successfully", { duration: 2000 });
        refetchSubscriptions();
      } catch (error) {
        console.error("Error cancelling subscription:", error);
        toast.error("Failed to cancel subscription", { duration: 2000 });
      }
    }
  };

  const handleRefresh = () => {
    refetchSubscriptions();
    refetchStats();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  if (isSubscriptionsError || isStatsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading subscription data. Please try again.</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Header - Subscription Management */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 sticky top-0 text-white pt-6 pb-6">
        <div className="px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Subscription Management</h1>
              <p className="text-blue-100 mt-1">Manage and monitor all meal plan subscriptions</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/seller/subscriptions/analytics')}
                className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-lg hover:bg-white/30 transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              <button
                onClick={handleRefresh}
                className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-lg hover:bg-white/30 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b border-gray-200 sticky top-25 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by subscription ID or plan name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cards">Card View</option>
                  <option value="list">List View</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatsCard
            title="Total"
            value={calculatedStats.total}
            icon={Receipt}
            color="bg-blue-500"
          />
          <StatsCard
            title="Active"
            value={calculatedStats.active}
            icon={CheckCircle}
            color="bg-green-500"
          />
          <StatsCard
            title="Paused"
            value={calculatedStats.paused}
            icon={Pause}
            color="bg-yellow-500"
          />
          <StatsCard
            title="Cancelled"
            value={calculatedStats.cancelled}
            icon={XCircle}
            color="bg-red-500"
          />
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="px-4 pb-6">
        {filteredSubscriptions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No subscriptions found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div>
            {viewMode === "cards" ? (
              <div>
                {filteredSubscriptions.map((subscription) => (
                  <SubscriptionCard
                    key={subscription._id}
                    subscription={subscription}
                    onViewDetails={handleViewDetails}
                    onEdit={handleEdit}
                    onPause={handlePauseSubscription}
                    onResume={handleResumeSubscription}
                    onCancel={handleCancelSubscription}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSubscriptions.map((subscription) => (
                  <div key={subscription._id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{subscription.subscriptionId}</h3>
                        <p className="text-sm text-gray-500">
                          {subscription.mealPlan?.planName || subscription.mealPlan?.title || subscription.mealPlan?.name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={subscription.status} />
                        <button
                          onClick={() => handleViewDetails(subscription._id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Load More */}
        {filteredSubscriptions.length > 0 && filteredSubscriptions.length < totalCount && (
          <div className="text-center mt-6">
            <button
              onClick={() => setPage(page + 1)}
              className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerSubscriptions;
