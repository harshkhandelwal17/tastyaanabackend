import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  useCreateProductMutation, 
  useUpdateProductMutation,
  useUploadProductImagesMutation,
} from '../redux/api/sellerProductsApi';
import { defaultProductValues, validateProduct } from '../schemas/productSchema';

export const useProductForm = (product = null) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ...defaultProductValues,
    ...(product || {})
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [removedImageUrls, setRemovedImageUrls] = useState([]);

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [uploadImages] = useUploadProductImagesMutation();

  // Handle input changes
  const handleChange = useCallback((e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'file') {
      handleImageUpload(files);
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle array fields (tags, ingredients, allergens)
  const handleArrayChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle variant changes
  const handleVariantChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const variants = [...prev.variants];
      variants[index] = {
        ...variants[index],
        [field]: field === 'price' || field === 'stock' ? Number(value) : value
      };
      return { ...prev, variants };
    });
  }, []);

  // Add a new variant
  const addVariant = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        { name: '', price: 0, stock: 0, sku: '' }
      ]
    }));
  }, []);

  // Remove a variant
  const removeVariant = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    
    const validFiles = Array.from(files).slice(0, 5 - formData.images.length);
    if (validFiles.length === 0) {
      toast('Maximum 5 images allowed', { duration: 2000 });
      return;
    }

    setUploadingImages(true);
    
    try {
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('images', file);
      });

      const result = await uploadImages(formData).unwrap();
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...result.images]
      }));
      
      toast.success(`${validFiles.length} image(s) uploaded successfully`, { duration: 2000 });
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Failed to upload images. Please try again.', { duration: 2000 });
    } finally {
      setUploadingImages(false);
    }
  }, [formData.images.length, uploadImages]);

  // Remove an image
  const removeImage = useCallback((index) => {
    const imageToRemove = formData.images[index];
    
    // If it's an existing image (has URL), add to removed images
    if (typeof imageToRemove === 'string' || imageToRemove.url) {
      const url = typeof imageToRemove === 'string' ? imageToRemove : imageToRemove.url;
      setRemovedImageUrls(prev => [...prev, url]);
    }
    
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  }, [formData.images]);

  // Toggle variant mode
  const toggleVariantMode = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      hasVariants: !prev.hasVariants,
      // Reset variants when disabling variant mode
      variants: !prev.hasVariants ? [{ name: '', price: 0, stock: 0, sku: '' }] : []
    }));
  }, []);

  // Validate form
  const validateForm = useCallback(() => {
    const validationErrors = validateProduct(formData);
    setErrors(validationErrors || {});
    return !validationErrors;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting', { duration: 2000 });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const productData = { ...formData };
      
      // Prepare data for API
      if (productData.hasVariants) {
        // If product has variants, use variant prices/stocks instead of root
        delete productData.price;
        delete productData.stock;
      } else {
        // If no variants, ensure variants array is empty
        productData.variants = [];
      }
      
      // Handle removed images if any
      if (removedImageUrls.length > 0) {
        productData.removedImageUrls = removedImageUrls;
      }
      
      let result;
      
      if (product?._id) {
        // Update existing product
        result = await updateProduct({
          id: product._id,
          ...productData
        }).unwrap();
        toast.success('Product updated successfully', { duration: 2000 });
      } else {
        // Create new product
        result = await createProduct(productData).unwrap();
        toast.success('Product created successfully', { duration: 2000 });
      }
      
      // Navigate to product list or view page
      navigate('/seller/products');
      
      return result;
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error?.data?.message || 'Failed to save product', { duration: 2000 });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, product?._id, validateForm, removedImageUrls, navigate, createProduct, updateProduct]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({ ...defaultProductValues });
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    isSubmitting: isSubmitting || isCreating || isUpdating,
    uploadingImages,
    handleChange,
    handleArrayChange,
    handleVariantChange,
    addVariant,
    removeVariant,
    handleImageUpload,
    removeImage,
    toggleVariantMode,
    handleSubmit,
    resetForm,
    validateForm
  };
};

export default useProductForm;
