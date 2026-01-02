import React, { useState } from 'react';
import { useGetHisaabHistoryQuery } from '../../redux/storee/api';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  TablePagination,
  TableFooter,
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, isSameDay } from 'date-fns';
import { Close as CloseIcon } from '@mui/icons-material';

const HistoryDialog = ({ open, onClose, sellerId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State for pagination and filters
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedDate, setSelectedDate] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  // Fetch history data
  const { data: historyData, isLoading, isError, error } = useGetHisaabHistoryQuery(
    { 
      startDate: startDate?.toISOString(), 
      endDate: endDate?.toISOString() 
    },
    { skip: !open || !sellerId }
  );

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle date selection
  const handleDateSelect = (hisaab) => {
    setSelectedDate(hisaab);
  };

  // Close detail view
  const handleCloseDetail = () => {
    setSelectedDate(null);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return format(parseISO(dateString), 'MMM d, yyyy');
  };

  // Filter history data based on pagination
  const paginatedHistory = historyData?.data?.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  ) || [];

  if (isError) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Error Loading History</DialogTitle>
        <DialogContent>
          <Typography color="error">
            {error?.data?.message || 'Failed to load history data'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={selectedDate ? 'md' : 'lg'} 
      fullWidth
      fullScreen={isMobile}
    >
      {selectedDate ? (
        // Detail view for a single day
        <>
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <span>Details for {formatDate(selectedDate.date)}</span>
              <IconButton onClick={handleCloseDetail} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                      <Box component="span" display="flex" alignItems="center">
                        <Box component="span" sx={{ width: 8, height: 8, bgcolor: 'primary.main', borderRadius: '50%', mr: 1 }} />
                        Total Sales
                      </Box>
                    </Typography>
                    <Typography variant="h6">₹{selectedDate.totalSell?.toFixed(2) || '0.00'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                      <Box component="span" display="flex" alignItems="center">
                        <Box component="span" sx={{ width: 8, height: 8, bgcolor: 'warning.main', borderRadius: '50%', mr: 1 }} />
                        Delayed Orders
                      </Box>
                    </Typography>
                    <Typography variant="h6" color="warning.main">
                      {selectedDate.ordersInfo?.delayedOrders || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                      <Box component="span" display="flex" alignItems="center">
                        <Box component="span" sx={{ width: 8, height: 8, bgcolor: 'error.main', borderRadius: '50%', mr: 1 }} />
                        Handover Flags
                      </Box>
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {selectedDate.ordersInfo?.flaggedHandovers || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                      <Box component="span" display="flex" alignItems="center">
                        <Box component="span" sx={{ width: 8, height: 8, bgcolor: 'text.secondary', borderRadius: '50%', mr: 1 }} />
                        Tiffins
                      </Box>
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">{selectedDate.totalTiffin || 0}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Other: {selectedDate.totalOther || 0}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Typography variant="h6" gutterBottom>Products</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Total Count</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Time</TableCell>
                    <TableCell align="right">Total Amount</TableCell>
                    <TableCell align="center">Flags</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedDate.groupedProducts?.length > 0 ? (
                    selectedDate.groupedProducts.map((product, index) => (
                      <TableRow 
                        key={`${product.productName}_${product.price}`}
                        sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {product.totalCount}x {product.productName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {product.type} • {product.unit}
                            </Typography>
                            {product.transactions.length > 1 && (
                              <Typography variant="caption" color="primary" display="block">
                                {product.transactions.length} transactions
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" fontWeight="bold">
                            {product.totalCount}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            ₹{product.price?.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box>
                            {product.transactions.map((transaction, tIndex) => (
                              <Box key={tIndex} sx={{ mb: 0.5 }}>
                                <Typography variant="caption" color="textSecondary" display="block">
                                  {format(new Date(transaction.time), 'HH:mm')}
                                  {product.transactions.length > 1 && (
                                    <span> ({transaction.count}x)</span>
                                  )}
                                </Typography>
                                {(transaction.delayFlag || transaction.handoverFlag) && (
                                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
                                    {transaction.delayFlag && (
                                      <Chip 
                                        label="DELAYED" 
                                        size="small" 
                                        color="warning" 
                                        sx={{ fontSize: '0.6rem', height: 16 }}
                                      />
                                    )}
                                    {transaction.handoverFlag && (
                                      <Chip 
                                        label="FLAG" 
                                        size="small" 
                                        color="error" 
                                        sx={{ fontSize: '0.6rem', height: 16 }}
                                      />
                                    )}
                                  </Box>
                                )}
                              </Box>
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" fontWeight="bold" color="success.main">
                            ₹{product.totalAmount?.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {selectedDate.ordersInfo?.orders?.some(order => 
                            (order.delayFlag || order.handoverFlag) && 
                            format(new Date(order.createdAt), 'yyyy-MM-dd') === format(new Date(selectedDate.date), 'yyyy-MM-dd')
                          ) ? (
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              {selectedDate.ordersInfo.orders
                                .filter(order => order.delayFlag)
                                .length > 0 && (
                                <Chip label="DELAYED" size="small" color="warning" />
                              )}
                              {selectedDate.ordersInfo.orders
                                .filter(order => order.handoverFlag)
                                .length > 0 && (
                                <Chip label="FLAG" size="small" color="error" />
                              )}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No products found for this day
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {selectedDate.notes && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Notes</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="body2">{selectedDate.notes}</Typography>
                </Paper>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetail}>Back to History</Button>
          </DialogActions>
        </>
      ) : (
        // List view of all history
        <>
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <span>Sales History</span>
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            <Box mt={2} display="flex" flexWrap="wrap" gap={2}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(date) => setStartDate(date)}
                  renderInput={(params) => (
                    <TextField {...params} size="small" variant="outlined" />
                  )}
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(date) => setEndDate(date)}
                  minDate={startDate}
                  renderInput={(params) => (
                    <TextField {...params} size="small" variant="outlined" />
                  )}
                />
              </LocalizationProvider>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {isLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : paginatedHistory.length === 0 ? (
              <Box p={2} textAlign="center">
                <Typography>No history found for the selected date range</Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Total Sales</TableCell>
                      <TableCell align="right">Tiffins</TableCell>
                      <TableCell align="right">Other Items</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedHistory.map((hisaab) => (
                      <TableRow 
                        key={hisaab._id} 
                        hover 
                        onClick={() => handleDateSelect(hisaab)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{formatDate(hisaab.date)}</TableCell>
                        <TableCell align="right">₹{hisaab.totalSell?.toFixed(2)}</TableCell>
                        <TableCell align="right">{hisaab.totalTiffin || 0}</TableCell>
                        <TableCell align="right">{hisaab.totalOther || 0}</TableCell>
                        <TableCell align="right">
                          <Button size="small" color="primary">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        count={historyData?.data?.length || 0}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                      />
                    </TableRow>
                  </TableFooter>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Close</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default HistoryDialog;
