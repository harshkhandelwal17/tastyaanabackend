import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
  useMediaQuery,
  useTheme,
  Divider,
  CircularProgress,
  Stack
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import SellerLayout from '../../components/seller/SellerLayout';

const SellerOrdersPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useSelector((state) => state.auth);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  // Mock data - replace with actual API call
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setOrders([
        {
          id: 'ORD-001',
          customerName: 'John Doe',
          customerPhone: '+91 9876543210',
          items: 3,
          total: 450,
          status: 'pending',
          orderDate: '2024-01-15T10:30:00Z',
          deliveryAddress: '123 Main St, Mumbai, MH 400001',
          paymentMethod: 'Online',
          paymentStatus: 'paid',
          estimatedDelivery: '2024-01-15T18:00:00Z'
        },
        {
          id: 'ORD-002',
          customerName: 'Jane Smith',
          customerPhone: '+91 9876543211',
          items: 1,
          total: 200,
          status: 'confirmed',
          orderDate: '2024-01-15T09:15:00Z',
          deliveryAddress: '456 Park Ave, Delhi, DL 110001',
          paymentMethod: 'Cash on Delivery',
          paymentStatus: 'pending',
          estimatedDelivery: '2024-01-15T19:00:00Z'
        },
        {
          id: 'ORD-003',
          customerName: 'Mike Johnson',
          customerPhone: '+91 9876543212',
          items: 2,
          total: 350,
          status: 'preparing',
          orderDate: '2024-01-15T08:45:00Z',
          deliveryAddress: '789 Oak St, Bangalore, KA 560001',
          paymentMethod: 'Online',
          paymentStatus: 'paid',
          estimatedDelivery: '2024-01-15T17:30:00Z'
        },
        {
          id: 'ORD-004',
          customerName: 'Sarah Wilson',
          customerPhone: '+91 9876543213',
          items: 4,
          total: 680,
          status: 'ready',
          orderDate: '2024-01-15T07:20:00Z',
          deliveryAddress: '321 Pine St, Chennai, TN 600001',
          paymentMethod: 'Online',
          paymentStatus: 'paid',
          estimatedDelivery: '2024-01-15T16:45:00Z'
        },
        {
          id: 'ORD-005',
          customerName: 'Robert Brown',
          customerPhone: '+91 9876543214',
          items: 2,
          total: 320,
          status: 'delivered',
          orderDate: '2024-01-14T19:30:00Z',
          deliveryAddress: '654 Elm St, Pune, MH 411001',
          paymentMethod: 'Online',
          paymentStatus: 'paid',
          estimatedDelivery: '2024-01-15T12:00:00Z'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'preparing': return <Package className="h-4 w-4" />;
      case 'ready': return <Package className="h-4 w-4" />;
      case 'out_for_delivery': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const handleStatusUpdate = (orderId, newStatus) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus }
        : order
    ));
  };

  const handleViewOrder = (order) => {
    console.log('View order:', order);
    // Navigate to order details page
  };

  const columns = [
    {
      header: 'Order ID',
      accessor: 'id',
      sortable: true,
      cell: (value) => (
        <div className="font-medium text-gray-900">{value}</div>
      )
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      sortable: true,
      cell: (value, item) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500 flex items-center mt-1">
            <Phone className="h-3 w-3 mr-1" />
            {item.customerPhone}
          </div>
        </div>
      )
    },
    {
      header: 'Items',
      accessor: 'items',
      sortable: true,
      cell: (value) => (
        <span className="text-sm text-gray-900">{value} items</span>
      )
    },
    {
      header: 'Total',
      accessor: 'total',
      sortable: true,
      cell: (value) => (
        <div className="font-medium text-gray-900">{formatCurrency(value)}</div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(value)}`}>
          <span className="mr-1">{getStatusIcon(value)}</span>
          {value.replace('_', ' ')}
        </span>
      )
    },
    {
      header: 'Order Date',
      accessor: 'orderDate',
      sortable: true,
      cell: (value) => (
        <div className="text-sm text-gray-900">{formatDate(value)}</div>
      )
    },
    {
      header: 'Payment',
      accessor: 'paymentStatus',
      sortable: true,
      cell: (value, item) => (
        <div>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            value === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            <DollarSign className="h-3 w-3 mr-1" />
            {value}
          </div>
          <div className="text-xs text-gray-500 mt-1">{item.paymentMethod}</div>
        </div>
      )
    }
  ];

  const actions = [
    {
      label: 'View Details',
      icon: Eye,
      onClick: handleViewOrder,
      className: 'text-blue-600 hover:text-blue-900'
    }
  ];

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and track all your customer orders
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total Orders" value={orderStats.total} color="bg-gray-100 text-gray-800" />
          <StatCard label="Pending" value={orderStats.pending} color="bg-yellow-100 text-yellow-800" />
          <StatCard label="Confirmed" value={orderStats.confirmed} color="bg-blue-100 text-blue-800" />
          <StatCard label="Preparing" value={orderStats.preparing} color="bg-orange-100 text-orange-800" />
          <StatCard label="Ready" value={orderStats.ready} color="bg-purple-100 text-purple-800" />
          <StatCard label="Delivered" value={orderStats.delivered} color="bg-green-100 text-green-800" />
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Status Updates</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatusButton 
              label="Mark as Confirmed" 
              color="bg-blue-600 hover:bg-blue-700" 
              onClick={() => console.log('Bulk confirm')} 
            />
            <StatusButton 
              label="Mark as Preparing" 
              color="bg-orange-600 hover:bg-orange-700" 
              onClick={() => console.log('Bulk preparing')} 
            />
            <StatusButton 
              label="Mark as Ready" 
              color="bg-purple-600 hover:bg-purple-700" 
              onClick={() => console.log('Bulk ready')} 
            />
            <StatusButton 
              label="Mark as Delivered" 
              color="bg-green-600 hover:bg-green-700" 
              onClick={() => console.log('Bulk delivered')} 
            />
          </div>
        </div>

        {/* Orders Table */}
        <ResponsiveTable
          columns={columns}
          data={orders}
          loading={loading}
          onRowClick={handleViewOrder}
          actions={actions}
          searchable={true}
          filterable={true}
          pagination={true}
          itemsPerPage={10}
        />
      </div>
    </SellerLayout>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
    <div className="text-center">
      <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
      <dd className="mt-1">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
          {value}
        </span>
      </dd>
    </div>
  </div>
);

const StatusButton = ({ label, color, onClick }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${color} focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
  >
    {label}
  </button>
);

export default SellerOrdersPage;