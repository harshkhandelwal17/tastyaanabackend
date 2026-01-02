import React, { useState } from "react";
import {
  useGetTodaysHisaabQuery,
  useAddHisaabProductMutation as useAddProductMutation,
  useUpdateHisaabProductMutation as useUpdateProductMutation,
  useDeleteHisaabProductMutation as useDeleteProductMutation,
  useGetHisaabHistoryQuery,
  useGetHisaabByDateQuery,
  useCreateOrUpdateHisaabMutation,
  useGetSubscriptionUsersQuery,
} from "../../redux/storee/api";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import ProductForm from "../../components/hisaab/ProductForm";
import HistoryDialog from "../../components/hisaab/HistoryDialog";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

const UnofficialHisaab = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  // RTK Query hooks
  const {
    data: hisaab,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetTodaysHisaabQuery();
  const { data: subscriptionUsers = [] } = useGetSubscriptionUsersQuery();
  const [addProduct] = useAddProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  // Local state
  const [openForm, setOpenForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [openHistory, setOpenHistory] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Handle form submission
  const handleSubmit = async (productData) => {
    console.time("handleSubmit");
    console.log("=== FORM SUBMISSION STARTED ===");
    console.log("Raw form data:", JSON.stringify(productData, null, 2));

    // Reset any previous error states
    setSnackbar({ open: false, message: "", severity: "success" });

    try {
      // Verify user is authenticated
      if (!user?.id) {
        const error = new Error(
          "No user ID found. User might not be authenticated."
        );
        console.error(error.message);
        setSnackbar({
          open: true,
          message: "Authentication required. Please log in again.",
          severity: "error",
        });
        throw error;
      }

      // Validate required fields
      if (!productData.productName?.trim()) {
        const error = new Error("Product name is required");
        console.error(error.message);
        setSnackbar({
          open: true,
          message: "Please enter a product name",
          severity: "error",
        });
        throw error;
      }
      console.log("product data ", productData);
      // Prepare data for submission with all required fields
      const dataToSubmit = {
        productName: productData.productName?.trim() || "",
        type: productData.type || "tiffin",
        count: Math.max(0.01, Number(productData.count) || 1),
        price: Math.max(0.01, Number(productData.price) || 0),
        unit: productData.unit || "piece",
        sellsTo: Array.isArray(productData.sellsTo)
          ? productData.sellsTo.filter(Boolean)
          : [],
        sellsBy: productData?.deliveryBoyName,
        sellerId: productData?.sellerId, // Always use the current user's ID
        // Include any additional fields that might be needed
        ...(productData.selectedProduct && {
          selectedProduct: productData.selectedProduct,
        }),
        ...(productData.selectedSeller && {
          selectedSeller: productData.selectedSeller,
        }),
      };

      // Log the prepared data for debugging
      console.log("Prepared data for submission:", dataToSubmit);
      console.log(
        "Prepared submission data:",
        JSON.stringify(dataToSubmit, null, 2)
      );

      // Ensure we have all required data
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      let result;

      try {
        if (editingProduct) {
          // Handle update product
          if (!editingProduct._id) {
            throw new Error("Invalid product data for update");
          }

          console.log("Updating existing product...");
          const updateData = {
            id: editingProduct._id,
            ...dataToSubmit,
          };
          console.log("Update payload:", JSON.stringify(updateData, null, 2));

          result = await updateProduct(updateData).unwrap();
          console.log("Update successful. Result:", result);

          setSnackbar({
            open: true,
            message: "Product updated successfully",
            severity: "success",
          });
        } else {
          // Handle add new product
          console.log("Adding new product...");
          console.log(
            "Add product payload:",
            JSON.stringify(dataToSubmit, null, 2)
          );

          result = await addProduct(dataToSubmit).unwrap();
          console.log("Add product successful. Response:", result);

          setSnackbar({
            open: true,
            message: "Product added successfully",
            severity: "success",
          });
        }

        // Close form and reset state on success
        setOpenForm(false);
        setEditingProduct(null);

        // Refetch the hisaab data
        await refetch();

        return result;
      } catch (apiError) {
        console.error("API call failed:", {
          name: apiError.name,
          message: apiError.message,
          status: apiError.status,
          data: apiError.data,
          stack: apiError.stack,
        });
        throw apiError; // Re-throw to be caught by the outer try-catch
      }
    } catch (err) {
      console.error("Error submitting product:", {
        error: err,
        response: err?.data,
        status: err?.status,
        message: err?.data?.message,
        stack: err.stack,
      });

      let errorMessage = "Something went wrong. Please try again.";
      if (err.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (err.status === 400) {
        errorMessage =
          err.data?.message || "Invalid data. Please check your input.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      console.timeEnd("handleSubmit");
    }
  };

  // Handle edit product
  const handleEditProduct = (product) => {
    console.log("Editing product:", product);

    // Prepare the product data with all required fields for the form
    const productData = {
      ...product,
      // Map the product fields to form fields
      sellerId: product.sellerId || user?.id,
      sellerName: product.sellsBy || user?.name,
      type: product.type || "tiffin",
      count: product.count || 1,
      price: product.price || 0,
      unit: product.unit || "piece",
      collectedPayment: product.collectedPayment || 0,
      sellsTo: Array.isArray(product.sellsTo) ? product.sellsTo : [],
      entryDate: product.entryDate || new Date().toISOString().split("T")[0],
      subscriptionUser: product.subscriptionUser || "",
      isSubscription: product.type === "subscription",
    };

    console.log("Prepared product data for form:", productData);
    setEditingProduct(productData);
    setOpenForm(true);
  };

  // Handle delete product
  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(productId).unwrap();
        setSnackbar({
          open: true,
          message: "Product deleted successfully",
          severity: "success",
        });
        refetch();
      } catch (err) {
        setSnackbar({
          open: true,
          message: err?.data?.message || "Failed to delete product",
          severity: "error",
        });
      }
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return (
      <Alert severity="error">
        {error?.data?.message || "Failed to load hisaab data"}
      </Alert>
    );

  return (
    <div>
      <Container maxWidth="lg" sx={{ mt: { xs: 20, sm: 12 }, py: 4 }}>
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Daily Hisaab
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenForm(true)}
            >
              Add Product
            </Button>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => setOpenHistory(true)}
            >
              View History
            </Button>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={3}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Sales
                </Typography>
                <Typography variant="h5" component="div">
                  ₹{hisaab?.data?.totalSell?.toFixed(2) || "0.00"}
                  {/* {console.log(hisaab)} */}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={3}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Tiffins
                </Typography>
                <Typography variant="h5" component="div">
                  {hisaab?.data?.totalTiffin || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={3}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Other Items
                </Typography>
                <Typography variant="h5" component="div">
                  {hisaab?.data?.totalOther || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={3}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Orders
                </Typography>
                <Typography variant="h5" component="div">
                  {hisaab?.data?.ordersInfo?.totalOrders || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Order Status Cards - New Feature */}
        {hisaab?.data?.ordersInfo && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card
                elevation={3}
                sx={{
                  border:
                    hisaab.data.ordersInfo.delayedOrders > 0
                      ? "2px solid"
                      : "1px solid",
                  borderColor:
                    hisaab.data.ordersInfo.delayedOrders > 0
                      ? "warning.main"
                      : "divider",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <ScheduleIcon color="warning" sx={{ mr: 1 }} />
                    <Typography color="textSecondary" gutterBottom>
                      Delayed Orders
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" color="warning.main">
                    {hisaab.data.ordersInfo.delayedOrders}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Orders exceeding 20-minute prep time
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card
                elevation={3}
                sx={{
                  border:
                    hisaab.data.ordersInfo.flaggedHandovers > 0
                      ? "2px solid"
                      : "1px solid",
                  borderColor:
                    hisaab.data.ordersInfo.flaggedHandovers > 0
                      ? "error.main"
                      : "divider",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <WarningIcon color="error" sx={{ mr: 1 }} />
                    <Typography color="textSecondary" gutterBottom>
                      Handover Flags
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" color="error.main">
                    {hisaab.data.ordersInfo.flaggedHandovers}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Ready but not picked up by delivery
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Orders with Countdown & Flags - New Feature */}
        {hisaab?.data?.ordersInfo?.orders &&
          hisaab.data.ordersInfo.orders.length > 0 && (
            <Paper elevation={3} sx={{ p: isMobile ? 1 : 3, mb: 4 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center" }}
              >
                <ScheduleIcon sx={{ mr: 1 }} />
                Today's Orders Status
              </Typography>
              <TableContainer>
                <Table size={isMobile ? "small" : "medium"}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Time Left</TableCell>
                      <TableCell align="center">Flags</TableCell>
                      <TableCell>Completion</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {hisaab.data.ordersInfo.orders.map((order) => (
                      <TableRow
                        key={order._id}
                        sx={{
                          backgroundColor: order.delayInfo?.isOverdue
                            ? "error.light"
                            : "inherit",
                          "&:hover": {
                            backgroundColor: order.delayInfo?.isOverdue
                              ? "error.main"
                              : "action.hover",
                          },
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            #{order.orderNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {order.userId?.name || "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={order.status}
                            size="small"
                            color={
                              order.status === "delivered"
                                ? "success"
                                : order.status === "cancelled"
                                ? "error"
                                : order.status === "preparing"
                                ? "warning"
                                : order.status === "ready"
                                ? "info"
                                : "default"
                            }
                          />
                        </TableCell>
                        <TableCell align="center">
                          {order.delayInfo?.timeRemaining !== null ? (
                            <Box>
                              <Typography
                                variant="body2"
                                color={
                                  order.delayInfo.timeRemaining <= 5
                                    ? "error.main"
                                    : "text.primary"
                                }
                                fontWeight={
                                  order.delayInfo.timeRemaining <= 5
                                    ? "bold"
                                    : "normal"
                                }
                              >
                                {order.delayInfo.timeRemaining > 0
                                  ? `${order.delayInfo.timeRemaining}m`
                                  : "OVERDUE"}
                              </Typography>
                              {order.delayInfo.isOverdue && (
                                <Typography
                                  variant="caption"
                                  color="error.main"
                                  display="block"
                                >
                                  +{order.delayInfo.delayMinutes}m
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              gap: 0.5,
                              flexWrap: "wrap",
                              justifyContent: "center",
                            }}
                          >
                            {order.delayInfo?.isDelayed && (
                              <Chip
                                label="DELAYED"
                                size="small"
                                color="warning"
                              />
                            )}
                            {order.handoverFlag && (
                              <Chip label="FLAG" size="small" color="error" />
                            )}
                            {!order.delayInfo?.isDelayed &&
                              !order.handoverFlag && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  -
                                </Typography>
                              )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {order.status === "delivered" &&
                            order.actualDelivery
                              ? format(new Date(order.actualDelivery), "HH:mm")
                              : order.status === "ready" &&
                                order.handoverDetails?.restaurantMarkedReady
                                  ?.markedAt
                              ? format(
                                  new Date(
                                    order.handoverDetails.restaurantMarkedReady.markedAt
                                  ),
                                  "HH:mm"
                                )
                              : "-"}
                          </Typography>
                          {order.handoverFlag && (
                            <Typography
                              variant="caption"
                              color="error.main"
                              display="block"
                            >
                              Waiting {order.handoverFlag.waitTime}m
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

        {/* Products Table */}
        <Paper elevation={3} sx={{ p: isMobile ? 1 : 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Today's Products
          </Typography>
          <TableContainer>
            <Table size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Total Count</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Time/Freq</TableCell>
                  <TableCell align="right">Total Amount</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hisaab?.data?.groupedProducts?.length > 0 ? (
                  hisaab.data.groupedProducts.map((product, index) => (
                    <TableRow
                      key={`${product.productName}_${product.price}`}
                      sx={{
                        "&:hover": {
                          backgroundColor: "action.hover",
                          cursor: "pointer",
                        },
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {product.totalCount}x {product.productName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {product.type} • {product.unit} • ₹{product.price}{" "}
                            each
                          </Typography>
                          {product.transactions.length > 1 && (
                            <Typography
                              variant="caption"
                              color="primary"
                              display="block"
                            >
                              {product.transactions.length} transactions
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" fontWeight="bold">
                          {product.totalCount}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1">
                          ₹{product.price.toFixed(2)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          display="block"
                        >
                          per {product.unit}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="caption" color="textSecondary">
                          {product.transactions.length === 1
                            ? format(
                                new Date(product.transactions[0].time),
                                "HH:mm"
                              )
                            : `${product.transactions.length} times`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {product.subscriptionUser ? (
                          <Box>
                            <Typography variant="body2">
                              {subscriptionUsers?.find(
                                (u) => u._id === product.subscriptionUser
                              )?.name || "Unknown User"}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {subscriptionUsers?.find(
                                (u) => u._id === product.subscriptionUser
                              )?.email || ""}
                            </Typography>
                          </Box>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {product.entryDate
                          ? new Date(product.entryDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          color="success.main"
                        >
                          ₹{product.totalAmount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: "flex", gap: 1 }}>
                          {product.transactions.map((transaction, tIndex) => (
                            <IconButton
                              key={transaction._id}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Find the original product for editing
                                const originalProduct =
                                  hisaab.data.products?.find(
                                    (p) => p._id === transaction._id
                                  );
                                if (originalProduct) {
                                  handleEdit(originalProduct);
                                }
                              }}
                              sx={{ mr: 0.5 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          ))}
                          {product.transactions.map((transaction, tIndex) => (
                            <IconButton
                              key={`del_${transaction._id}`}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(transaction._id);
                              }}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No products added today. Click 'Add Product' to get
                      started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Product Form Dialog */}
        <Dialog
          open={openForm}
          onClose={() => {
            setOpenForm(false);
            setEditingProduct(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingProduct ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogContent>
            <ProductForm
              user={user}
              onSubmit={handleSubmit}
              initialValues={editingProduct || undefined}
              onCancel={() => {
                setOpenForm(false);
                setEditingProduct(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <HistoryDialog
          open={openHistory}
          onClose={() => setOpenHistory(false)}
          sellerId={user?._id}
        />

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </div>
  );
};

export default UnofficialHisaab;
