import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  TextField,
  Button,
  Grid,
  MenuItem,
  Box,
  InputAdornment,
  Chip,
  Typography,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  ListItemText,
  FormControlLabel,
  Switch,
  Autocomplete,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Close as CloseIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import {
  useGetSellersQuery,
  useGetSubscriptionUsersQuery,
} from "../../redux/storee/api";

// Mock data for delivery boys - in a real app, this would come from an API
const DELIVERY_BOYS = [
  { id: 1, name: "Rahul Kumar", phone: "9876543210" },
  { id: 2, name: "Amit Singh", phone: "9876543211" },
  { id: 3, name: "Vijay Sharma", phone: "9876543212" },
  { id: 4, name: "Suresh Patel", phone: "9876543213" },
  { id: 5, name: "Ramesh Gupta", phone: "9876543214" },
];

// Default values
// Default values
const productTypes = [
  { value: "tiffin", label: "Tiffin" },
  { value: "subscription", label: "Subscription" },
  { value: "subscription", label: "Subscription" },
  { value: "other", label: "Other" },
];

const units = [
  { value: "piece", label: "Piece" },
  { value: "plate", label: "Plate" },
  { value: "plate", label: "Plate" },
  { value: "kg", label: "Kilogram" },
  { value: "packet", label: "Packet" },
  { value: "dozen", label: "Dozen" },
  { value: "litre", label: "Litre" },
];

const orderTypes = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
];

const validationSchema = Yup.object({
  sellerId: Yup.string().required("Seller is required"),
  sellerName: Yup.string().required("Seller name is required"),
  productName: Yup.string().required("Product name is required"),
  type: Yup.string().required("Type is required"),
  count: Yup.number().required("Count is required").min(0.01).max(10000),
  price: Yup.number()
    .required("Price is required")
    .min(0, "Price must be positive"),
  collectedPayment: Yup.number()
    .min(0, "Collected payment cannot be negative")
    .max(Yup.ref("price"), "Collected payment cannot be more than price")
    .when("isSubscription", (isSubscription, schema) => {
      return isSubscription
        ? schema.nullable()
        : schema.required("Collected payment is required");
    }),
  unit: Yup.string().required("Unit is required"),
  isSubscription: Yup.boolean(),
  subscriptionUser: Yup.string().when(
    "isSubscription",
    (isSubscription, schema) => {
      return isSubscription
        ? schema.required("Subscription user is required")
        : schema.nullable();
    }
  ),
  sellsTo: Yup.array().of(Yup.string().email("Invalid email")),
  deliveryBoyName: Yup.string()
    .required("Delivery boy name is required")
    .default(""),
  deliveryBoyPhone: Yup.string()
    .matches(/^[0-9]{10}$/, "Please enter a valid 10-digit phone number")
    .default(""),
  // deliveryBoyName: Yup.string().required("Delivery boy name is required").default(""),
  // deliveryBoyPhone: Yup.string().matches(/^[0-9]{10}$/, "Please enter a valid 10-digit phone number").default("")
});

const ProductForm = ({ onSubmit, initialValues = {}, onCancel }) => {
  const [customerEmail, setCustomerEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState(
    DELIVERY_BOYS[0]
  );

  // Fetch sellers and subscription users
  const { data: sellersResponse, isLoading: isLoadingSellers } =
    useGetSellersQuery();
  const {
    data: subscriptionUsersResponse,
    isLoading: isLoadingSubscriptionUsers,
  } = useGetSubscriptionUsersQuery();

  // Extract sellers and subscription users from the response with proper fallbacks
  const sellers = sellersResponse?.data || [];
  const subscriptionUsers = subscriptionUsersResponse?.data || [];

  // Debug logs
  if (process.env.NODE_ENV === "development") {
    console.log("Sellers data:", sellers);
    console.log("Subscription users data:", subscriptionUsers);
  }

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      sellerId: "",
      sellerName: "",
      productName: initialValues.productName || "",
      type: initialValues.type || "tiffin",
      orderType: initialValues.orderType || "offline",
      count: initialValues.count || 1,
      price: initialValues.price || 10, // Set a valid default price
      collectedPayment:
        initialValues.collectedPayment || initialValues.price || 10, // Match price initially
      unit: initialValues.unit || "piece",
      sellsTo: initialValues.sellsTo || [],
      deliveryBoyName: initialValues.deliveryBoyName || DELIVERY_BOYS[0].name,
      deliveryBoyPhone:
        initialValues.deliveryBoyPhone || DELIVERY_BOYS[0].phone,
    },
    validationSchema,
    onSubmit: (values) => {
      const formData = {
        ...values,
        productName: values.type === "tiffin" ? "Veg Thali" : "Other",
        sellsBy: values.sellerName,
        sellerId: values.sellerId,
        isSubscription: values.isSubscription,
        subscriptionUser: values.isSubscription
          ? values.subscriptionUser
          : null,
        // Set collectedPayment to 0 for subscription orders
        collectedPayment: values.isSubscription ? 0 : values.collectedPayment,
        // Remove temporary fields before submission
        sellerName: undefined,
      };
      console.log("form data:", formData);
      console.log("values.sellerName:", values.sellerName);
      console.log("values.sellerId:", values.sellerId);
      // Show confirmation dialog instead of directly submitting
      setFormDataToSubmit(formData);
      setConfirmationOpen(true);
    },
  });

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.group("Form State Update");
      console.log("Values:", formik.values);
      console.log("Errors:", formik.errors);
      console.log("Touched:", formik.touched);
      console.log("Is Valid:", formik.isValid);
      console.log("Is Submitting:", formik.isSubmitting);
      console.groupEnd();
    }
  }, [
    formik.values,
    formik.errors,
    formik.touched,
    formik.isValid,
    formik.isSubmitting,
  ]);
  const handleAddCustomer = () => {
    if (!customerEmail) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (formik.values.sellsTo.includes(customerEmail)) {
      setEmailError("This email is already added");
      return;
    }

    formik.setFieldValue("sellsTo", [...formik.values.sellsTo, customerEmail]);
    setCustomerEmail("");
    setEmailError("");
  };

  const handleSellerChange = (event, value) => {
    if (value) {
      formik.setFieldValue("sellerId", value._id || "");
      formik.setFieldValue("sellerName", value.name || "");
      formik.setFieldTouched("sellerId", true, true);
      formik.setFieldTouched("sellerName", true, true);
    } else {
      formik.setFieldValue("sellerId", "");
      formik.setFieldValue("sellerName", "");
      formik.setFieldTouched("sellerId", true, true);
      formik.setFieldTouched("sellerName", true, true);
    }
  };

  // Update form values when type changes
  useEffect(() => {
    if (formik.values.type !== "subscription") {
      formik.setFieldValue("subscriptionUser", "");
    }

    // Set default unit based on type
    if (formik.values.type === "tiffin") {
      formik.setFieldValue("unit", "plate");
    } else if (formik.values.type === "other") {
      formik.setFieldValue("unit", "piece");
    }
  }, [formik.values.type]);

  const handleRemoveCustomer = (email) => {
    formik.setFieldValue(
      "sellsTo",
      formik.values.sellsTo.filter((e) => e !== email)
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomer();
    }
  };

  // Confirmation dialog handlers
  const handleConfirmSubmission = () => {
    try {
      setConfirmationOpen(false);
      if (formDataToSubmit) {
        console.log("Submitting data to backend:", formDataToSubmit);
        onSubmit(formDataToSubmit);
        setFormDataToSubmit(null);
      } else {
        alert("please ensure all details are correctly filled");
      }
    } catch (error) {
      console.log("an error occured", error.message);
    }
  };

  const handleCancelConfirmation = () => {
    setConfirmationOpen(false);
    setFormDataToSubmit(null);
  };

  return (
    <>
      <form onSubmit={formik.handleSubmit} style={{ marginTop: "8px" }}>
        <Grid container spacing={2}>
          {/* Seller Selection */}
          <Grid item xs={12} sm={8} md={6}>
            <Autocomplete
              id="seller-select"
              options={sellers || []}
              getOptionLabel={(option) => option?.name || ""}
              value={
                sellers.find(
                  (seller) => seller?._id === formik.values.sellerId
                ) || null
              }
              onChange={handleSellerChange}
              onBlur={() => {
                formik.setFieldTouched("sellerId", true, true);
                formik.setFieldTouched("sellerName", true, true);
              }}
              loading={isLoadingSellers}
              renderInput={(params) => (
                <TextField
                  {...params}
                  name="sellerId"
                  label="Select Seller"
                  variant="outlined"
                  margin="normal"
                  error={
                    formik.touched.sellerId && Boolean(formik.errors.sellerId)
                  }
                  helperText={formik.touched.sellerId && formik.errors.sellerId}
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {isLoadingSellers ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                  onBlur={() => {
                    formik.handleBlur({ target: { name: "sellerId" } });
                  }}
                />
              )}
              isOptionEqualToValue={(option, value) =>
                option?._id === value?._id
              }
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <PersonIcon sx={{ mr: 1 }} />
                  {option.name}
                </Box>
              )}
            />
          </Grid>

          {/* Product Name (hidden, fixed value) */}
          <input type="hidden" name="productName" value="Veg Thali" />

          {/* Type and Subscription Toggle */}
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Type</InputLabel>
              <Select
                name="type"
                value={formik.values.type}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.type && Boolean(formik.errors.type)}
                label="Type"
              >
                {productTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.type && formik.errors.type && (
                <Typography color="error" variant="caption">
                  {formik.errors.type}
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Subscription User (Conditional) */}
          {formik.values.isSubscription && (
            <Grid item xs={12} sm={6} md={4}>
              <Autocomplete
                id="subscription-user-select"
                options={subscriptionUsers || []}
                getOptionLabel={(option) => option?.email || ""}
                value={
                  subscriptionUsers.find(
                    (user) => user?._id === formik.values.subscriptionUser
                  ) || null
                }
                onChange={(event, value) => {
                  formik.setFieldValue("subscriptionUser", value?._id || "");
                }}
                loading={isLoadingSubscriptionUsers}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Subscription User"
                    variant="outlined"
                    margin="normal"
                    error={
                      formik.touched.subscriptionUser &&
                      Boolean(formik.errors.subscriptionUser)
                    }
                    helperText={
                      formik.touched.subscriptionUser &&
                      formik.errors.subscriptionUser
                    }
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <React.Fragment>
                          {isLoadingSubscriptionUsers ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </React.Fragment>
                      ),
                    }}
                  />
                )}
                isOptionEqualToValue={(option, value) =>
                  option?._id === value?._id
                }
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <PersonIcon sx={{ mr: 1 }} />
                    {option.name} ({option.email})
                  </Box>
                )}
              />
            </Grid>
          )}

          {/* Unit */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Unit"
              name="unit"
              value={formik.values.unit}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.unit && Boolean(formik.errors.unit)}
              helperText={formik.touched.unit && formik.errors.unit}
              variant="outlined"
              margin="normal"
            >
              {units.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Count */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Count"
              name="count"
              type="number"
              value={formik.values.count}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.count && Boolean(formik.errors.count)}
              helperText={formik.touched.count && formik.errors.count}
              variant="outlined"
              margin="normal"
              inputProps={{ min: 0.01, step: 0.01 }}
            />
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="sellerName"
                name="sellerName"
                label="Seller Name"
                value={formik.values.sellerName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.sellerName && Boolean(formik.errors.sellerName)
                }
                helperText={
                  formik.touched.sellerName && formik.errors.sellerName
                }
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel id="delivery-boy-label">Delivery Boy</InputLabel>
                <Select
                  labelId="delivery-boy-label"
                  id="deliveryBoyName"
                  name="deliveryBoyName"
                  value={formik.values.deliveryBoyName}
                  onChange={(e) => {
                    const selected = DELIVERY_BOYS.find(
                      (db) => db.name === e.target.value
                    );
                    formik.setFieldValue("deliveryBoyName", selected.name);
                    formik.setFieldValue("deliveryBoyPhone", selected.phone);
                  }}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.deliveryBoyName &&
                    Boolean(formik.errors.deliveryBoyName)
                  }
                  label="Delivery Boy"
                >
                  {DELIVERY_BOYS.map((db) => (
                    <MenuItem key={db.id} value={db.name}>
                      {db.name} ({db.phone})
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.deliveryBoyName &&
                  formik.errors.deliveryBoyName && (
                    <div
                      style={{
                        color: "#f44336",
                        fontSize: "0.75rem",
                        margin: "3px 14px 0",
                      }}
                    >
                      {formik.errors.deliveryBoyName}
                    </div>
                  )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="deliveryBoyPhone"
                name="deliveryBoyPhone"
                label="Delivery Boy Phone"
                value={formik.values.deliveryBoyPhone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.deliveryBoyPhone &&
                  Boolean(formik.errors.deliveryBoyPhone)
                }
                helperText={
                  (formik.touched.deliveryBoyPhone &&
                    formik.errors.deliveryBoyPhone) ||
                  "10-digit phone number"
                }
                margin="normal"
                required
                type="tel"
                inputProps={{
                  readOnly: true,
                  maxLength: 10,
                  pattern: "[0-9]{10}",
                }}
              />
            </Grid>
          </Grid>

          {/* Price */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Price"
              name="price"
              type="number"
              value={formik.values.price}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.price && Boolean(formik.errors.price)}
              helperText={formik.touched.price && formik.errors.price}
              variant="outlined"
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">₹</InputAdornment>
                ),
              }}
              inputProps={{ min: 0.01, step: 0.01 }}
            />
          </Grid>

          {/* Collected Payment - Only show for non-subscription orders */}
          {!formik.values.isSubscription && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Collected Payment"
                name="collectedPayment"
                type="number"
                value={formik.values.collectedPayment}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.collectedPayment &&
                  Boolean(formik.errors.collectedPayment)
                }
                helperText={
                  formik.touched.collectedPayment &&
                  formik.errors.collectedPayment
                }
                variant="outlined"
                margin="normal"
                required={!formik.values.isSubscription}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₹</InputAdornment>
                  ),
                }}
              />
            </Grid>
          )}

          {/* Total Price */}
          <Grid item xs={12}>
            <Typography variant="subtitle2">
              Total: ₹{(formik.values.count * formik.values.price).toFixed(2)}
            </Typography>
          </Grid>

          {/* Emails (sellsTo) */}
          <Grid item xs={12}>
            <Typography variant="subtitle2">Sold To (Optional)</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
              {formik.values.sellsTo.map((email) => (
                <Chip
                  key={email}
                  label={email}
                  onDelete={() => handleRemoveCustomer(email)}
                  deleteIcon={<CloseIcon />}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Add customer email"
                value={customerEmail}
                onChange={(e) => {
                  setCustomerEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                onKeyDown={handleKeyDown}
                error={Boolean(emailError)}
                helperText={emailError}
                variant="outlined"
              />
              <Button
                variant="outlined"
                onClick={handleAddCustomer}
                startIcon={<AddIcon />}
              >
                Add
              </Button>
            </Box>
          </Grid>

          {/* Buttons */}
          <Grid
            item
            xs={12}
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              mt: 2,
              pt: 2,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Button
              variant="outlined"
              color="error"
              onClick={onCancel}
              disabled={formik.isSubmitting}
              sx={{ minWidth: 120 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={formik.isSubmitting || !formik.isValid}
              startIcon={<AddIcon />}
              sx={{ minWidth: 180 }}
            >
              {initialValues._id ? "Update" : "Add"} Entry
            </Button>
          </Grid>
        </Grid>
      </form>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmationOpen}
        onClose={handleCancelConfirmation}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Entry Details</DialogTitle>
        <DialogContent>
          {formDataToSubmit && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Please confirm the following details:
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography>
                  <strong>Product Name:</strong> {formDataToSubmit.productName}
                </Typography>
                <Typography>
                  <strong>Order Type:</strong> {formDataToSubmit.orderType}
                </Typography>
                <Typography>
                  <strong>Type:</strong> {formDataToSubmit.type}
                </Typography>
                <Typography>
                  <strong>Count:</strong> {formDataToSubmit.count}{" "}
                  {formDataToSubmit.unit}
                </Typography>
                <Typography>
                  <strong>Price:</strong> ₹{formDataToSubmit.price}
                </Typography>
                <Typography>
                  <strong>Collected Payment:</strong> ₹
                  {formDataToSubmit.collectedPayment}
                </Typography>
                <Typography>
                  <strong>Total:</strong> ₹
                  {(formDataToSubmit.count * formDataToSubmit.price).toFixed(2)}
                </Typography>
                <Typography>
                  <strong>Seller:</strong>{" "}
                  {sellers.find((s) => s._id === formik.values.sellerId)
                    ?.name || formDataToSubmit.sellsBy}
                </Typography>
                <Typography>
                  <strong>Delivery Boy:</strong>{" "}
                  {formDataToSubmit.deliveryBoyName} (
                  {formDataToSubmit.deliveryBoyPhone})
                </Typography>
                {formDataToSubmit.sellsTo.length > 0 && (
                  <Typography>
                    <strong>Sold To:</strong>{" "}
                    {formDataToSubmit.sellsTo.join(", ")}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleCancelConfirmation}
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmSubmission}
            startIcon={<AddIcon />}
            sx={{ minWidth: 120 }}
          >
            Confirm & Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductForm;
