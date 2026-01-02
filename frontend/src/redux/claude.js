// from chat of clude  <Redux App Setup & Additional Components>



// // src/App.js
// import React from 'react';
// import { Provider } from 'react-redux';
// import { store } from './store';
// import { BrowserRouter } from 'react-router-dom';
// import AppRouter from './components/AppRouter';
// import ErrorBoundary from './components/ErrorBoundary';
// import './index.css';


// // src/components/AppRouter.js
// import React, { useEffect } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { Routes, Route, Navigate } from 'react-router-dom';
// import { setCredentials } from '../store/slices/authSlice';
// import LoginPage from './LoginPage';
// import SellerPanelApp from './SellerPanelApp';
// import LoadingSpinner from './LoadingSpinner';

// const AppRouter = () => {
//   const dispatch = useDispatch();
//   const { isAuthenticated, user, token } = useSelector((state) => state.auth);
//   const [isInitializing, setIsInitializing] = React.useState(true);

//   useEffect(() => {
//     // Check for existing token and user data on app startup
//     const storedToken = localStorage.getItem('token');
//     const storedUser = localStorage.getItem('user');
    
//     if (storedToken && storedUser) {
//       try {
//         const parsedUser = JSON.parse(storedUser);
//         dispatch(setCredentials({
//           token: storedToken,
//           user: parsedUser
//         }));
//       } catch (error) {
//         // Clear invalid data
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//       }
//     }
    
//     setIsInitializing(false);
//   }, [dispatch]);

//   if (isInitializing) {
//     return <LoadingSpinner />;
//   }

//   return (
//     <Routes>
//       <Route
//         path="/login"
//         element={
//           isAuthenticated ?
//           <Navigate to="/dashboard" replace /> :
//           <LoginPage />
//         }
//       />
//       <Route
//         path="/*"
//         element={
//           isAuthenticated && user?.role === 'seller' ?
//           <SellerPanelApp /> :
//           <Navigate to="/login" replace />
//         }
//       />
//       <Route
//         path="/"
//         element={<Navigate to="/dashboard" replace />}
//       />
//     </Routes>
//   );
// };

// export default AppRouter;

// // src/components/LoginPage.js
// import React, { useState } from 'react';
// import { useDispatch } from 'react-redux';
// import { useLoginMutation } from '../store/api/authApi';
// import { setCredentials } from '../store/slices/authSlice';
// import { Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react';

// const LoginPage = () => {
//   const dispatch = useDispatch();
//   const [login, { isLoading }] = useLoginMutation();
  
//   const [formData, setFormData] = useState({
//     email: '',
//     password: ''
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState('');

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//     if (error) setError('');
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');

//     try {
//       const result = await login(formData).unwrap();
      
//       // Store user data in localStorage for persistence
//       localStorage.setItem('user', JSON.stringify(result.user));
      
//       dispatch(setCredentials({
//         token: result.token,
//         user: result.user
//       }));
//     } catch (err) {
//       setError(err?.data?.message || 'Login failed. Please try again.');
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
//       <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
//         <div className="text-center mb-8">
//           <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
//             <LogIn className="w-8 h-8 text-white" />
//           </div>
//           <h1 className="text-2xl font-bold text-gray-900">Seller Portal</h1>
//           <p className="text-gray-600">Sign in to your seller account</p>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           {error && (
//             <div className="bg-red-50 border border-red-200 rounded-lg p-3">
//               <p className="text-red-600 text-sm">{error}</p>
//             </div>
//           )}

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Email Address
//             </label>
//             <div className="relative">
//               <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleInputChange}
//                 className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Enter your email"
//                 required
//               />
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Password
//             </label>
//             <div className="relative">
//               <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//               <input
//                 type={showPassword ? 'text' : 'password'}
//                 name="password"
//                 value={formData.password}
//                 onChange={handleInputChange}
//                 className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Enter your password"
//                 required
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//               >
//                 {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
//               </button>
//             </div>
//           </div>

//           <button
//             type="submit"
//             disabled={isLoading}
//             className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
//           >
//             {isLoading ? (
//               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//             ) : (
//               <>
//                 <LogIn className="w-5 h-5 mr-2" />
//                 Sign In
//               </>
//             )}
//           </button>
//         </form>

//         <div className="mt-6 pt-6 border-t border-gray-200">
//           <p className="text-center text-sm text-gray-600">
//             Demo Credentials: seller@demo.com / password123
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginPage;

// src/components/LoadingSpinner.js
// import React from 'react';
// import { RefreshCw } from 'lucide-react';

// const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => {
//   const sizeClasses = {
//     small: 'w-4 h-4',
//     medium: 'w-8 h-8',
//     large: 'w-12 h-12'
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-50">
//       <div className="text-center">
//         <RefreshCw className={`${sizeClasses[size]} animate-spin text-blue-600 mx-auto mb-4`} />
//         <p className="text-gray-600">{text}</p>
//       </div>
//     </div>
//   );
// };

// export default LoadingSpinner;

// // src/components/ErrorBoundary.js
// import React from 'react';
// import { AlertTriangle, RefreshCw } from 'lucide-react';

// class ErrorBoundary extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = { hasError: false, error: null };
//   }

//   static getDerivedStateFromError(error) {
//     return { hasError: true, error };
//   }

//   componentDidCatch(error, errorInfo) {
//     console.error('Error caught by boundary:', error, errorInfo);
//   }

//   render() {
//     if (this.state.hasError) {
//       return (
//         <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//           <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
//             <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
//             <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
//             <p className="text-gray-600 mb-6">
//               We're sorry, but something unexpected happened. Please try refreshing the page.
//             </p>
//             <button
//               onClick={() => window.location.reload()}
//               className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//             >
//               <RefreshCw className="w-4 h-4 mr-2" />
//               Refresh Page
//             </button>
//           </div>
//         </div>
//       );
//     }

//     return this.props.children;
//   }
// }

// export default ErrorBoundary;

// // src/components/ProductForm.js
// import React, { useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useCreateProductMutation, useUpdateProductMutation, useUploadProductImagesMutation } from '../store/api/sellerApi';
// import { toggleModal } from '../store/slices/uiSlice';
// import { X, Upload, Plus, Trash2 } from 'lucide-react';

// const ProductForm = ({ product = null, isOpen = false }) => {
//   const dispatch = useDispatch();
//   const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
//   const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
//   const [uploadImages] = useUploadProductImagesMutation();

//   const [formData, setFormData] = useState({
//     title: product?.title || '',
//     description: product?.description || '',
//     price: product?.price || '',
//     stock: product?.stock || '',
//     category: product?.category?._id || '',
//     images: product?.images || [],
//     variants: product?.variants || []
//   });

//   const [uploadingImages, setUploadingImages] = useState(false);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleImageUpload = async (e) => {
//     const files = Array.from(e.target.files);
//     if (files.length === 0) return;

//     setUploadingImages(true);
//     try {
//       const formDataObj = new FormData();
//       files.forEach(file => {
//         formDataObj.append('images', file);
//       });

//       const result = await uploadImages(formDataObj).unwrap();
//       setFormData(prev => ({
//         ...prev,
//         images: [...prev.images, ...result.images]
//       }));
//     } catch (error) {
//       console.error('Image upload failed:', error);
//     } finally {
//       setUploadingImages(false);
//     }
//   };

//   const removeImage = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       images: prev.images.filter((_, i) => i !== index)
//     }));
//   };

//   const addVariant = () => {
//     setFormData(prev => ({
//       ...prev,
//       variants: [...prev.variants, { size: '', color: '', stock: 0, price: 0 }]
//     }));
//   };

//   const updateVariant = (index, field, value) => {
//     setFormData(prev => ({
//       ...prev,
//       variants: prev.variants.map((variant, i) =>
//         i === index ? { ...variant, [field]: value } : variant
//       )
//     }));
//   };

//   const removeVariant = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       variants: prev.variants.filter((_, i) => i !== index)
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     try {
//       if (product) {
//         await updateProduct({ id: product._id, ...formData }).unwrap();
//       } else {
//         await createProduct(formData).unwrap();
//       }
      
//       dispatch(toggleModal({ modal: 'productForm', isOpen: false }));
//       // Reset form
//       setFormData({
//         title: '',
//         description: '',
//         price: '',
//         stock: '',
//         category: '',
//         images: [],
//         variants: []
//       });
//     } catch (error) {
//       console.error('Failed to save product:', error);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
//       <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
//         <div className="flex items-center justify-between p-6 border-b">
//           <h2 className="text-xl font-semibold text-gray-900">
//             {product ? 'Edit Product' : 'Add New Product'}
//           </h2>
//           <button
//             onClick={() => dispatch(toggleModal({ modal: 'productForm', isOpen: false }))}
//             className="text-gray-400 hover:text-gray-600"
//           >
//             <X className="w-6 h-6" />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="p-6 space-y-6">
//           {/* Basic Information */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Product Title *
//               </label>
//               <input
//                 type="text"
//                 name="title"
//                 value={formData.title}
//                 onChange={handleInputChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Category *
//               </label>
//               <select
//                 name="category"
//                 value={formData.category}
//                 onChange={handleInputChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//                 required
//               >
//                 <option value="">Select Category</option>
//                 <option value="electronics">Electronics</option>
//                 <option value="fashion">Fashion</option>
//                 <option value="home">Home & Garden</option>
//                 <option value="sports">Sports</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Price (₹) *
//               </label>
//               <input
//                 type="number"
//                 name="price"
//                 value={formData.price}
//                 onChange={handleInputChange}
//                 min="0"
//                 step="0.01"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Stock Quantity *
//               </label>
//               <input
//                 type="number"
//                 name="stock"
//                 value={formData.stock}
//                 onChange={handleInputChange}
//                 min="0"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 required
//               />
//             </div>
//           </div>

//           {/* Description */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Description *
//             </label>
//             <textarea
//               name="description"
//               value={formData.description}
//               onChange={handleInputChange}
//               rows={4}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               required
//             />
//           </div>

//           {/* Image Upload */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Product Images
//             </label>
//             <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
//               <input
//                 type="file"
//                 multiple
//                 accept="image/*"
//                 onChange={handleImageUpload}
//                 className="hidden"
//                 id="image-upload"
//               />
//               <label
//                 htmlFor="image-upload"
//                 className="flex flex-col items-center justify-center cursor-pointer"
//               >
//                 <Upload className="w-8 h-8 text-gray-400 mb-2" />
//                 <span className="text-sm text-gray-600">
//                   {uploadingImages ? 'Uploading...' : 'Click to upload images'}
//                 </span>
//               </label>
//             </div>
            
//             {/* Image Preview */}
//             {formData.images.length > 0 && (
//               <div className="mt-4 grid grid-cols-3 gap-4">
//                 {formData.images.map((image, index) => (
//                   <div key={index} className="relative">
//                     <img
//                       src={image.url}
//                       alt={`Product ${index + 1}`}
//                       className="w-full h-24 object-cover rounded-lg"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => removeImage(index)}
//                       className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
//                     >
//                       <X className="w-4 h-4" />
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Variants */}
//           <div>
//             <div className="flex items-center justify-between mb-4">
//               <label className="block text-sm font-medium text-gray-700">
//                 Product Variants
//               </label>
//               <button
//                 type="button"
//                 onClick={addVariant}
//                 className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
//               >
//                 <Plus className="w-4 h-4 mr-1" />
//                 Add Variant
//               </button>
//             </div>
            
//             {formData.variants.map((variant, index) => (
//               <div key={index} className="grid grid-cols-4 gap-4 mb-4 p-4 border rounded-lg">
//                 <input
//                   type="text"
//                   placeholder="Size"
//                   value={variant.size}
//                   onChange={(e) => updateVariant(index, 'size', e.target.value)}
//                   className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
//                 />
//                 <input
//                   type="text"
//                   placeholder="Color"
//                   value={variant.color}
//                   onChange={(e) => updateVariant(index, 'color', e.target.value)}
//                   className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
//                 />
//                 <input
//                   type="number"
//                   placeholder="Stock"
//                   value={variant.stock}
//                   onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value))}
//                   className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
//                 />
//                 <div className="flex items-center space-x-2">
//                   <input
//                     type="number"
//                     placeholder="Price"
//                     value={variant.price}
//                     onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value))}
//                     className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => removeVariant(index)}
//                     className="text-red-600 hover:text-red-700"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* Submit Buttons */}
//           <div className="flex justify-end space-x-4 pt-6 border-t">
//             <button
//               type="button"
//               onClick={() => dispatch(toggleModal({ modal: 'productForm', isOpen: false }))}
//               className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={isCreating || isUpdating}
//               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
//             >
//               {isCreating || isUpdating ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default ProductForm;

// // package.json dependencies for frontend
// /*
// {
//   "name": "seller-panel-frontend",
//   "version": "0.1.0",
//   "private": true,
//   "dependencies": {
//     "@reduxjs/toolkit": "^1.9.7",
//     "react": "^18.2.0",
//     "react-dom": "^18.2.0",
//     "react-redux": "^8.1.3",
//     "react-router-dom": "^6.16.0",
//     "lucide-react": "^0.287.0",
//     "socket.io-client": "^4.7.2"
//   },
//   "devDependencies": {
//     "tailwindcss": "^3.3.3",
//     "autoprefixer": "^10.4.16",
//     "postcss": "^8.4.31"
//   },
//   "scripts": {
//     "start": "react-scripts start",
//     "build": "react-scripts build",
//     "test": "react-scripts test",
//     "eject": "react-scripts eject"
//   }
// }
// */




