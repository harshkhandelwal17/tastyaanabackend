import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useGetSellerProductByIdQuery } from '../../redux/api/sellerProductsApi';
import ProductForm from './ProductForm';
import toast from 'react-hot-toast';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Button,
  Paper,
  Container 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const ProductFormWrapper = ({ isEdit = false }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're coming from a successful product creation
  const { state } = location;
  const isNewlyCreated = state?.newProductId === productId;
  
  // Fetch product data if in edit mode
  const { 
    data: product, 
    isLoading, 
    isError, 
    error,
    isFetching
  } = useGetSellerProductByIdQuery(productId, {
    skip: !isEdit || !productId,
    refetchOnMountOrArgChange: true,
  });

  // Show success message for newly created products
  useEffect(() => {
    if (isNewlyCreated) {
      toast.success('Product created successfully!', { duration: 2000 });
      // Clear the state to prevent showing the message again on refresh
      window.history.replaceState({}, '');
    }
  }, [isNewlyCreated]);

  // Handle loading state
  if ((isEdit && isLoading) || isFetching) {
    return (
      <Container maxWidth="lg">
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          minHeight="60vh"
          textAlign="center"
        >
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" mt={3}>
            {isEdit ? 'Loading product details...' : 'Preparing form...'}
          </Typography>
        </Box>
      </Container>
    );
  }

  // Handle error state
  if (isError) {
    const errorMessage = error?.data?.message || 'Failed to load product data';
    
    return (
      <Container maxWidth="md">
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            my: 4, 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" color="error" gutterBottom>
            Oops! Something went wrong
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            {errorMessage}
          </Typography>
          <Box mt={3} display="flex" gap={2}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => window.location.reload()}
              startIcon={<RefreshIcon />}
            >
              Try Again
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate(-1)}
              startIcon={<ArrowBackIcon />}
            >
              Go Back
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Button 
          variant="outlined" 
          onClick={() => navigate(-1)}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 3 }}
        >
          Back to Products
        </Button>
        
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {isEdit 
              ? 'Update your product details below.'
              : 'Fill in the details below to add a new product to your store.'}
          </Typography>
        </Paper>
        
        <ProductForm 
          product={product} 
          isEdit={isEdit} 
          key={isEdit ? `edit-${productId}` : 'new-product'}
        />
      </Box>
    </Container>
  );
};

export default ProductFormWrapper;
