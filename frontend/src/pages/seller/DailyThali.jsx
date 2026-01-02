import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Divider,
  Alert,
  useTheme,
  useMediaQuery,
  Stack,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Restaurant as RestaurantIcon,
  Schedule as ScheduleIcon,
  LocalShipping as DeliveryIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon,
  Close,
} from '@mui/icons-material';
import { useGetTodaysHisaabQuery, useGetHisaabHistoryQuery } from '../../redux/storee/api';
import { useSelector } from 'react-redux';
import { format, isAfter, isBefore, parseISO } from 'date-fns';

const DailyThali = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { user } = useSelector((state) => state.auth);
  const [selectedStartDate, setSelectedStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEndDate, setSelectedEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyOpen, setHistoryOpen] = useState(false);
  
  // RTK Query hooks
  const {
    data: todaysHisaab,
    isLoading,
    isError,
    error,
    refetch
  } = useGetTodaysHisaabQuery();
  
  const {
    data: historyData,
    isLoading: isLoadingHistory
  } = useGetHisaabHistoryQuery({
    startDate: selectedStartDate,
    endDate: selectedEndDate
  });

  // Helper function to categorize by time
  const categorizeByTime = (products) => {
    const morning = []; // 6 AM - 12 PM
    const afternoon = []; // 12 PM - 6 PM
    const evening = []; // 6 PM - 12 AM

    products?.forEach(product => {
      // Check for timestamp fields in the product (from the schema timestamps: true)
      const timestamp = product.createdAt || product.updatedAt || product.timestamp;
      if (timestamp) {
        const hour = new Date(timestamp).getHours();
        if (hour >= 6 && hour < 12) {
          morning.push(product);
        } else if (hour >= 12 && hour < 18) {
          afternoon.push(product);
        } else {
          evening.push(product);
        }
      } else {
        // If no timestamp, default to afternoon
        afternoon.push(product);
      }
    });

    return { morning, afternoon, evening };
  };

  // Group products by price for thalis
  const groupThalisByPrice = (products) => {
    const thalis = products?.filter(p => p.type === 'tiffin') || [];
    const grouped = {};
    
    thalis.forEach(thali => {
      const price = thali.price;
      if (!grouped[price]) {
        grouped[price] = {
          price,
          count: 0,
          products: []
        };
      }
      grouped[price].count += thali.count;
      grouped[price].products.push(thali);
    });

    return Object.values(grouped);
  };

  // Get non-thali products
  const getNonThaliProducts = (products) => {
    return products?.filter(p => p.type !== 'tiffin') || [];
  };

  // Calculate time-wise counts
  const getTimeWiseCounts = (products) => {
    const timeGroups = categorizeByTime(products);
    return {
      morning: timeGroups.morning.reduce((sum, p) => sum + p.count, 0),
      afternoon: timeGroups.afternoon.reduce((sum, p) => sum + p.count, 0),
      evening: timeGroups.evening.reduce((sum, p) => sum + p.count, 0)
    };
  };

  // Get delivery tracking data
  const getDeliveryTracking = (products) => {
    return products?.map(product => {
      const timestamp = product.createdAt || product.updatedAt || product.timestamp;
      const deliveryTime = timestamp ? new Date(timestamp).toLocaleTimeString() : 'Not recorded';
      const hour = timestamp ? new Date(timestamp).getHours() : 14; // Default to afternoon if no timestamp
      
      return {
        ...product,
        deliveryTime,
        timeCategory: hour >= 6 && hour < 12 ? 'Morning' : 
                     hour >= 12 && hour < 18 ? 'Afternoon' : 'Evening'
      };
    }) || [];
  };

  const products = todaysHisaab?.data?.products || [];
  const thaliGroups = groupThalisByPrice(products);
  const nonThaliProducts = getNonThaliProducts(products);
  const tiffinProducts = products?.filter(p => p.type === 'tiffin') || [];
  const timeWiseCounts = getTimeWiseCounts(tiffinProducts);
  const deliveryTracking = getDeliveryTracking(products);

  // Use API totals if available, otherwise calculate from products
  const totalSalesFromAPI = todaysHisaab?.data?.totalSell || 0;
  const totalTiffinFromAPI = todaysHisaab?.data?.totalTiffin || 0;
  const totalOtherFromAPI = todaysHisaab?.data?.totalOther || 0;

  // Calculate totals from history data for date range
  const calculateHistoryTotals = (historyData) => {
    if (!historyData?.data || historyData.data.length === 0) {
      return {
        totalSales: 0,
        totalTiffin: 0,
        totalOther: 0,
        totalProducts: 0,
        allProducts: []
      };
    }

    let totalSales = 0;
    let totalTiffin = 0;
    let totalOther = 0;
    let allProducts = [];

    historyData.data.forEach(dayHisaab => {
      totalSales += dayHisaab.totalSell || 0;
      totalTiffin += dayHisaab.totalTiffin || 0;
      totalOther += dayHisaab.totalOther || 0;
      
      // Use grouped products if available, otherwise fall back to original products
      if (dayHisaab.groupedProducts) {
        // Flatten grouped products into individual transactions
        dayHisaab.groupedProducts.forEach(groupedProduct => {
          groupedProduct.transactions.forEach(transaction => {
            allProducts.push({
              productName: groupedProduct.productName,
              type: groupedProduct.type,
              unit: groupedProduct.unit,
              price: groupedProduct.price,
              count: transaction.count,
              createdAt: transaction.time,
              date: transaction.time,
              sellsBy: transaction.sellsBy,
              _id: transaction._id,
              // Add transaction-level flags
              delayFlag: transaction.delayFlag,
              handoverFlag: transaction.handoverFlag
            });
          });
        });
      } else if (dayHisaab.products) {
        allProducts = allProducts.concat(dayHisaab.products);
      }
    });

    return {
      totalSales,
      totalTiffin,
      totalOther,
      totalProducts: allProducts.length,
      allProducts
    };
  };

  const historyTotals = calculateHistoryTotals(historyData);

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 12, py: 4 }}>
        <Typography>Loading daily thali data...</Typography>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 12, py: 4 }}>
        <Alert severity="error">
          {error?.data?.message || 'Failed to load daily thali data'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{  py: isMobile ? 2 : 4, px: isMobile ? 1 : 3 }}>
      {/* Header */}
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? 2 : 0
      }}>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} component="h1" gutterBottom>
            Daily Transaction Dashboard
          </Typography>
          <Typography variant={isMobile ? "body2" : "subtitle1"} color="text.secondary">
            {format(new Date(), isMobile ? "MMM d, yyyy" : "EEEE, MMMM d, yyyy")}
          </Typography>
        </Box>
        <Stack direction={isMobile ? "column" : "row"} spacing={1} sx={{ width: isMobile ? '100%' : 'auto' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            size={isMobile ? "small" : "medium"}
            fullWidth={isMobile}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<HistoryIcon />}
            onClick={() => setHistoryOpen(true)}
            size={isMobile ? "small" : "medium"}
            fullWidth={isMobile}
          >
            History
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <RestaurantIcon color="primary" sx={{ mr: 1, fontSize: isMobile ? 20 : 24 }} />
                <Typography variant={isMobile ? "body2" : "body1"} color="textSecondary">
                  Total Thalis
                </Typography>
              </Box>
              <Typography variant={isMobile ? "h5" : "h4"} component="div">
                {totalTiffinFromAPI}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon color="success" sx={{ mr: 1, fontSize: isMobile ? 20 : 24 }} />
                <Typography variant={isMobile ? "body2" : "body1"} color="textSecondary">
                  {isMobile ? "Sales" : "Total Sales"}
                </Typography>
              </Box>
              <Typography variant={isMobile ? "h5" : "h4"} component="div">
                ₹{totalSalesFromAPI.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <RestaurantIcon color="secondary" sx={{ mr: 1, fontSize: isMobile ? 20 : 24 }} />
                <Typography variant={isMobile ? "body2" : "body1"} color="textSecondary">
                  {isMobile ? "Others" : "Other Products"}
                </Typography>
              </Box>
              <Typography variant={isMobile ? "h5" : "h4"} component="div">
                {totalOtherFromAPI}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DeliveryIcon color="info" sx={{ mr: 1, fontSize: isMobile ? 20 : 24 }} />
                <Typography variant={isMobile ? "body2" : "body1"} color="textSecondary">
                  {isMobile ? "Orders" : "Total Orders"}
                </Typography>
              </Box>
              <Typography variant={isMobile ? "h5" : "h4"} component="div">
                {todaysHisaab?.data?.ordersInfo?.totalOrders || products.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Order Status Alerts */}
      {todaysHisaab?.data?.ordersInfo && (
        <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ border: '1px solid', borderColor: 'warning.main' }}>
              <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ScheduleIcon color="warning" sx={{ mr: 1, fontSize: isMobile ? 20 : 24 }} />
                  <Typography variant={isMobile ? "subtitle1" : "h6"} color="warning.main">
                    Delayed Orders
                  </Typography>
                </Box>
                <Typography variant={isMobile ? "h4" : "h3"} component="div" color="warning.main">
                  {todaysHisaab.data.ordersInfo.delayedOrders}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Orders exceeding 20-minute preparation time
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={2} sx={{ border: '1px solid', borderColor: 'error.main' }}>
              <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Alert severity="error" sx={{ mr: 1, fontSize: isMobile ? 20 : 24, p: 0, minHeight: 'auto', '& .MuiAlert-icon': { fontSize: isMobile ? 20 : 24, mr: 0 } }} />
                  <Typography variant={isMobile ? "subtitle1" : "h6"} color="error.main">
                    Handover Flags
                  </Typography>
                </Box>
                <Typography variant={isMobile ? "h4" : "h3"} component="div" color="error.main">
                  {todaysHisaab.data.ordersInfo.flaggedHandovers}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Ready but not picked up by delivery partner
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Time-wise Thali Distribution */}
      <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: isMobile ? 2 : 3 }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <ScheduleIcon sx={{ mr: 1, fontSize: isMobile ? 20 : 24 }} />
              Time-wise Thali Distribution
            </Typography>
            <Grid container spacing={isMobile ? 1 : 2}>
              <Grid item xs={4} sm={4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', p: isMobile ? 1.5 : 2 }}>
                    <Typography variant={isMobile ? "body2" : "h6"} color="primary">Morning</Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: isMobile ? 'none' : 'block' }}>
                      6 AM - 12 PM
                    </Typography>
                    <Typography variant={isMobile ? "h5" : "h3"} sx={{ mt: 1 }}>
                      {timeWiseCounts.morning}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4} sm={4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', p: isMobile ? 1.5 : 2 }}>
                    <Typography variant={isMobile ? "body2" : "h6"} color="success.main">Afternoon</Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: isMobile ? 'none' : 'block' }}>
                      12 PM - 6 PM
                    </Typography>
                    <Typography variant={isMobile ? "h5" : "h3"} sx={{ mt: 1 }}>
                      {timeWiseCounts.afternoon}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4} sm={4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', p: isMobile ? 1.5 : 2 }}>
                    <Typography variant={isMobile ? "body2" : "h6"} color="warning.main">Evening</Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: isMobile ? 'none' : 'block' }}>
                      6 PM - 12 AM
                    </Typography>
                    <Typography variant={isMobile ? "h5" : "h3"} sx={{ mt: 1 }}>
                      {timeWiseCounts.evening}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Debug Information */}
      {/* <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="caption" component="div">
          <div><strong>Debug Info:</strong></div>
          <div>API Loading: {isLoading ? 'Yes' : 'No'}</div>
          <div>API Error: {isError ? 'Yes' : 'No'}</div>
          <div>Raw API Data: {JSON.stringify(todaysHisaab, null, 2)}</div>
          <div>Products count: {products.length}</div>
          <div>Thali groups: {thaliGroups.length}</div>
          <div>Time wise counts: {JSON.stringify(timeWiseCounts)}</div>
          {products.length > 0 && (
            <div>Sample product: {JSON.stringify(products[0], null, 2)}</div>
          )}
        </Typography>
      </Box> */}

      {/* Thali Price Groups */}
      <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: isMobile ? 2 : 3 }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
              Thali by Price Groups
            </Typography>
            {thaliGroups.length > 0 ? (
              <Box>
                {thaliGroups.map((group, index) => (
                  <Box key={index} sx={{ 
                    mb: 2, 
                    p: isMobile ? 1.5 : 2, 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 1 
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between', 
                      alignItems: isMobile ? 'flex-start' : 'center', 
                      mb: 1,
                      gap: isMobile ? 1 : 0
                    }}>
                      <Typography variant={isMobile ? "body1" : "subtitle1"} fontWeight="bold">
                        ₹{group.price} Thalis
                      </Typography>
                      <Chip label={`${group.count} sold`} color="primary" size="small" />
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      Total Revenue: ₹{(group.price * group.count).toFixed(2)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="textSecondary">
                {products.length === 0 ? 'No products found today' : 'No thali sales today'}
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: isMobile ? 2 : 3 }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
              Other Products
            </Typography>
            {nonThaliProducts.length > 0 ? (
              <Box>
                {nonThaliProducts.map((product, index) => (
                  <Box key={index} sx={{ 
                    mb: 2, 
                    p: isMobile ? 1.5 : 2, 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 1 
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between', 
                      alignItems: isMobile ? 'flex-start' : 'center', 
                      mb: 1,
                      gap: isMobile ? 1 : 0
                    }}>
                      <Typography variant={isMobile ? "body1" : "subtitle1"} fontWeight="bold">
                        {product.productName}
                      </Typography>
                      <Chip label={product.type} color="secondary" size="small" />
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Typography variant="body2">
                        {product.count} {product.unit} × ₹{product.price}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        ₹{(product.count * product.price).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="textSecondary">No other products sold today</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Order Status Tracking */}
      {todaysHisaab?.data?.ordersInfo?.orders && (
        <Paper elevation={2} sx={{ p: isMobile ? 2 : 3, mb: 3 }}>
          <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <ScheduleIcon sx={{ mr: 1, fontSize: isMobile ? 20 : 24 }} />
            Orders Status & Delays
          </Typography>
          
          {isMobile ? (
            // Mobile Card Layout for Orders
            <Box>
              {todaysHisaab.data.ordersInfo.orders.map((order, index) => (
                <Card key={order._id} variant="outlined" sx={{ mb: 2, border: order.delayInfo?.isOverdue ? '2px solid' : '1px solid', borderColor: order.delayInfo?.isOverdue ? 'error.main' : 'divider' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1" fontWeight="bold">
                        Order #{order.orderNumber}
                      </Typography>
                      <Chip 
                        label={order.status} 
                        size="small" 
                        color={
                          order.status === 'delivered' ? 'success' :
                          order.status === 'cancelled' ? 'error' :
                          order.status === 'preparing' ? 'warning' :
                          order.status === 'ready' ? 'info' : 'default'
                        }
                      />
                    </Box>
                    
                    <Grid container spacing={1} sx={{ mb: 1 }}>
                      {/* <Grid item xs={12}>
                        <Typography variant="caption" color="textSecondary">Customer:</Typography>
                        <Typography variant="body2">{order.userId?.name || 'N/A'}</Typography>
                      </Grid> */}
                      {order.delayInfo?.timeRemaining !== null && (
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">Time Left:</Typography>
                          <Typography variant="body2" color={order.delayInfo.timeRemaining <= 5 ? 'error.main' : 'text.primary'}>
                            {order.delayInfo.timeRemaining > 0 ? `${order.delayInfo.timeRemaining} min` : 'Overdue'}
                          </Typography>
                        </Grid>
                      )}
                      {order.delayInfo?.isOverdue && (
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">Delayed by:</Typography>
                          <Typography variant="body2" color="error.main">
                            {order.delayInfo.delayMinutes} min
                          </Typography>
                        </Grid>
                      )}
                    </Grid>

                    {/* Delay and Handover Flags */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {order.delayInfo?.isDelayed && (
                        <Chip 
                          label="DELAYED" 
                          size="small" 
                          color="warning"
                          sx={{ fontWeight: 'bold' }}
                        />
                      )}
                      {order.handoverFlag && (
                        <Chip 
                          label="HANDOVER FLAG" 
                          size="small" 
                          color="error"
                          sx={{ fontWeight: 'bold' }}
                        />
                      )}
                    </Box>
                    
                    {order.handoverFlag && (
                      <Typography variant="body2" color="error.main" sx={{ mt: 1, fontStyle: 'italic' }}>
                        {order.handoverFlag.message} ({order.handoverFlag.waitTime} min)
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            // Desktop Table Layout for Orders
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    {/* <TableCell>Customer</TableCell> */}
                    <TableCell>Status</TableCell>
                    <TableCell>Time Left</TableCell>
                    <TableCell>Delay Status</TableCell>
                    <TableCell>Flags</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todaysHisaab.data.ordersInfo.orders.map((order) => (
    
                    <TableRow 
                      key={order._id} 
                      hover
                      sx={{ 
                        backgroundColor: order.delayInfo?.isOverdue ? 'error.light' : 'inherit',
                        '&:hover': {
                          backgroundColor: order.delayInfo?.isOverdue ? 'error.main' : 'action.hover'
                        }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          #{order.orderNumber}
                        </Typography>
                      </TableCell>
                      {/* <TableCell>
                        <Typography variant="body2">
                          {order.userId?.name || 'N/A'}
                        </Typography>
                      </TableCell> */}
                      <TableCell>
                        <Chip 
                          label={order.status} 
                          size="small" 
                          color={
                            order.status === 'delivered' ? 'success' :
                            order.status === 'cancelled' ? 'error' :
                            order.status === 'preparing' ? 'warning' :
                            order.status === 'ready' ? 'info' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {order.delayInfo?.timeRemaining !== null ? (
                          <Typography 
                            variant="body2" 
                            color={order.delayInfo.timeRemaining <= 5 ? 'error.main' : 'text.primary'}
                            fontWeight={order.delayInfo.timeRemaining <= 5 ? 'bold' : 'normal'}
                          >
                            {order.delayInfo.timeRemaining > 0 ? `${order.delayInfo.timeRemaining} min` : 'Overdue'}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.delayInfo?.isDelayed ? (
                          <Box>
                            <Chip label="DELAYED" size="small" color="warning" sx={{ mb: 0.5 }} />
                            {order.delayInfo.isOverdue && (
                              <Typography variant="caption" color="error.main" display="block">
                                +{order.delayInfo.delayMinutes} min
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">On Time</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.handoverFlag ? (
                          <Box>
                            <Chip label="FLAG" size="small" color="error" sx={{ mb: 0.5 }} />
                            <Typography variant="caption" color="error.main" display="block">
                              Waiting {order.handoverFlag.waitTime}min
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Delivery Tracking */}
      <Paper elevation={2} sx={{ p: isMobile ? 2 : 3, mb: 3 }}>
        <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <DeliveryIcon sx={{ mr: 1, fontSize: isMobile ? 20 : 24 }} />
          Delivery Tracking & Timing
        </Typography>
        
        {isMobile ? (
          // Mobile Card Layout
          <Box>
            {deliveryTracking.length > 0 ? (
              deliveryTracking.map((item, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body1" fontWeight="bold">
                        {item.productName}
                      </Typography>
                      <Typography variant="body2" color="primary" fontWeight="bold">
                        ₹{(item.count * item.price).toFixed(2)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={item.timeCategory} 
                        size="small" 
                        color={
                          item.timeCategory === 'Morning' ? 'primary' :
                          item.timeCategory === 'Afternoon' ? 'success' : 'warning'
                        }
                      />
                      <Chip 
                        label={item.orderType || 'offline'} 
                        size="small"
                        variant="outlined"
                        color={item.orderType === 'online' ? 'primary' : 'default'}
                      />
                      <Chip label={item.type} size="small" variant="outlined" />
                    </Box>
                    
                    <Grid container spacing={1} sx={{ fontSize: '0.875rem' }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Time:</Typography>
                        <Typography variant="body2">{item.deliveryTime}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Quantity:</Typography>
                        <Typography variant="body2">{item.count} {item.unit}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="textSecondary">Delivered By:</Typography>
                        <Typography variant="body2">
                          {item.sellsBy || 'Not assigned'} 
                          {item.deliveryBoyPhone && ` (${item.deliveryBoyPhone})`}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                No deliveries recorded today
              </Typography>
            )}
          </Box>
        ) : (
          // Desktop Table Layout
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Delivered By</TableCell>
                  {/* <TableCell>Order Type</TableCell> */}
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deliveryTracking.length > 0 ? (
                  deliveryTracking.map((item, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{item.deliveryTime}</TableCell>
                      <TableCell>
                        <Chip 
                          label={item.timeCategory} 
                          size="small" 
                          color={
                            item.timeCategory === 'Morning' ? 'primary' :
                            item.timeCategory === 'Afternoon' ? 'success' : 'warning'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {item.productName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.type}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{item.count} {item.unit}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {item.sellsBy || 'Not assigned'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.deliveryBoyPhone || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      {/* <TableCell>
                        <Chip 
                          label={item.orderType || 'offline'} 
                          size="small"
                          variant="outlined"
                          color={item.orderType === 'online' ? 'primary' : 'default'}
                        />
                      </TableCell> */}
                      <TableCell align="right">
                        ₹{(item.count * item.price).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary">
                        No deliveries recorded today
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* History Dialog */}
      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <DateRangeIcon sx={{ mr: 1 }} />
              Sales History
            </Box>
            {isMobile && (
              <IconButton onClick={() => setHistoryOpen(false)}>
                  <Close/>
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Date Range Controls */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <TextField
                type="date"
                label="Start Date"
                value={selectedStartDate}
                onChange={(e) => setSelectedStartDate(e.target.value)}
                fullWidth
                size={isMobile ? "small" : "medium"}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                type="date"
                label="End Date"
                value={selectedEndDate}
                onChange={(e) => setSelectedEndDate(e.target.value)}
                fullWidth
                size={isMobile ? "small" : "medium"}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>

          {/* Summary Totals for Date Range */}
          <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom sx={{ fontWeight: 'bold' }}>
              Summary ({format(new Date(selectedStartDate), "MMM d")} - {format(new Date(selectedEndDate), "MMM d, yyyy")})
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Sales</Typography>
                <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold' }}>
                  ₹{historyTotals.totalSales.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Thalis</Typography>
                <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold' }}>
                  {historyTotals.totalTiffin}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Others</Typography>
                <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold' }}>
                  {historyTotals.totalOther}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Items</Typography>
                <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold' }}>
                  {historyTotals.totalProducts}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Products List in Delivery Tracking Style */}
          {historyTotals.allProducts && historyTotals.allProducts.length > 0 ? (
            <Box>
              <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <DeliveryIcon sx={{ mr: 1, fontSize: isMobile ? 20 : 24 }} />
                All Products in Date Range
              </Typography>

              {isMobile ? (
                // Mobile Card Layout
                <Box>
                  {historyTotals.allProducts.map((item, index) => (
                    <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" fontWeight="bold">
                            {item.productName}
                          </Typography>
                          <Typography variant="body2" color="primary" fontWeight="bold">
                            ₹{(item.count * item.price).toFixed(2)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                          <Chip 
                            label={item.timeCategory || (
                              item.createdAt ? 
                                (new Date(item.createdAt).getHours() >= 6 && new Date(item.createdAt).getHours() < 12 ? 'Morning' :
                                 new Date(item.createdAt).getHours() >= 12 && new Date(item.createdAt).getHours() < 18 ? 'Afternoon' : 'Evening')
                                : 'Unknown'
                            )} 
                            size="small" 
                            color={
                              (item.timeCategory || (
                                item.createdAt ? 
                                  (new Date(item.createdAt).getHours() >= 6 && new Date(item.createdAt).getHours() < 12 ? 'Morning' :
                                   new Date(item.createdAt).getHours() >= 12 && new Date(item.createdAt).getHours() < 18 ? 'Afternoon' : 'Evening')
                                  : 'Unknown'
                              )) === 'Morning' ? 'primary' :
                              (item.timeCategory || (
                                item.createdAt ? 
                                  (new Date(item.createdAt).getHours() >= 6 && new Date(item.createdAt).getHours() < 12 ? 'Morning' :
                                   new Date(item.createdAt).getHours() >= 12 && new Date(item.createdAt).getHours() < 18 ? 'Afternoon' : 'Evening')
                                  : 'Unknown'
                              )) === 'Afternoon' ? 'success' : 'warning'
                            }
                          />
                          <Chip label={item.type} size="small" variant="outlined" />
                          {item.delayFlag && (
                            <Chip 
                              label="DELAYED" 
                              size="small" 
                              color="warning"
                              sx={{ fontWeight: 'bold' }}
                            />
                          )}
                          {item.handoverFlag && (
                            <Chip 
                              label="FLAG" 
                              size="small" 
                              color="error"
                              sx={{ fontWeight: 'bold' }}
                            />
                          )}
                        </Box>
                        
                        <Grid container spacing={1} sx={{ fontSize: '0.875rem' }}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary">Time:</Typography>
                            <Typography variant="body2">
                              {item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : 'Not recorded'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary">Quantity:</Typography>
                            <Typography variant="body2">{item.count} {item.unit}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="caption" color="textSecondary">Delivered By:</Typography>
                            <Typography variant="body2">
                              {item.deliveryBoyName || item.sellsBy || 'Not assigned'} 
                              {item.deliveryBoyPhone && ` (${item.deliveryBoyPhone})`}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                // Desktop Table Layout
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Time</TableCell>
                        <TableCell>Period</TableCell>
                        <TableCell>Product</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Delivered By</TableCell>
                        <TableCell align="center">Flags</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {historyTotals.allProducts.map((item, index) => {
                        const timeCategory = item.createdAt ? 
                          (new Date(item.createdAt).getHours() >= 6 && new Date(item.createdAt).getHours() < 12 ? 'Morning' :
                           new Date(item.createdAt).getHours() >= 12 && new Date(item.createdAt).getHours() < 18 ? 'Afternoon' : 'Evening')
                          : 'Unknown';
                        
                        return (
                          <TableRow key={index} hover>
                            <TableCell>
                              {item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : 'Not recorded'}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={timeCategory} 
                                size="small" 
                                color={
                                  timeCategory === 'Morning' ? 'primary' :
                                  timeCategory === 'Afternoon' ? 'success' : 'warning'
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {item.productName}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {item.type}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{item.count} {item.unit}</TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2">
                                  {item.deliveryBoyName || item.sellsBy || 'Not assigned'}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {item.deliveryBoyPhone || 'N/A'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                {item.delayFlag && (
                                  <Chip 
                                    label="DELAYED" 
                                    size="small" 
                                    color="warning"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                )}
                                {item.handoverFlag && (
                                  <Chip 
                                    label="FLAG" 
                                    size="small" 
                                    color="error"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                )}
                                {!item.delayFlag && !item.handoverFlag && (
                                  <Typography variant="body2" color="text.secondary">-</Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              ₹{(item.count * item.price).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary">
                No sales data found for {format(new Date(selectedStartDate), "MMM d")} - {format(new Date(selectedEndDate), "MMM d, yyyy")}
              </Typography>
            </Box>
          )}
        </DialogContent>
        {!isMobile && (
          <DialogActions>
            <Button onClick={() => setHistoryOpen(false)}>Close</Button>
          </DialogActions>
        )}
      </Dialog>
    </Container>
  );
};

export default DailyThali;