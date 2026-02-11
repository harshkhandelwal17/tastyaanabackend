// const express = require('express');
// const router = express.Router();
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// // Middleware
// const {authenticate,authorize} = require('../middlewares/auth');
// // const adminMiddleware = require('../middleware/adminMiddleware');

// // Sample data (replace with database in production)
// let laundryOrders = [];
// let subscriptions = [];

// // Services configuration
// const services = [
//   {
//     id: 'wash-fold',
//     name: 'Wash & Fold',
//     icon: 'Shirt',
//     basePrice: 49,
//     deliveryTime: '24 hours',
//     items: [
//       { name: 'Shirts', price: 25, unit: 'piece' },
//       { name: 'T-Shirts', price: 20, unit: 'piece' },
//       { name: 'Trousers', price: 35, unit: 'piece' },
//       { name: 'Jeans', price: 40, unit: 'piece' },
//       { name: 'Undergarments', price: 10, unit: 'piece' }
//     ]
//   },
//   {
//     id: 'dry-clean',
//     name: 'Dry Cleaning',
//     icon: 'Sparkles',
//     basePrice: 99,
//     deliveryTime: '48 hours',
//     items: [
//       { name: 'Suits', price: 150, unit: 'piece' },
//       { name: 'Blazers', price: 120, unit: 'piece' },
//       { name: 'Dresses', price: 100, unit: 'piece' },
//       { name: 'Coats', price: 200, unit: 'piece' },
//       { name: 'Silk Items', price: 80, unit: 'piece' }
//     ]
//   },
//   {
//     id: 'iron-only',
//     name: 'Iron Only',
//     icon: 'Zap',
//     basePrice: 29,
//     deliveryTime: '12 hours',
//     items: [
//       { name: 'Shirts', price: 15, unit: 'piece' },
//       { name: 'T-Shirts', price: 12, unit: 'piece' },
//       { name: 'Trousers', price: 20, unit: 'piece' },
//       { name: 'Sarees', price: 25, unit: 'piece' },
//       { name: 'Kurtas', price: 18, unit: 'piece' }
//     ]
//   },
//   {
//     id: 'express',
//     name: 'Express Service',
//     icon: 'Clock',
//     basePrice: 79,
//     deliveryTime: '4 hours',
//     items: [
//       { name: 'Express Wash & Fold', price: 60, unit: 'piece' },
//       { name: 'Express Iron', price: 25, unit: 'piece' },
//       { name: 'Express Dry Clean', price: 180, unit: 'piece' }
//     ]
//   }
// ];

// const subscriptionPlans = [
//   {
//     id: 'basic',
//     name: 'Basic Plan',
//     monthlyPrice: 499,
//     yearlyPrice: 4990,
//     weight: '15 KG',
//     orders: '4 orders',
//     features: [
//       'Wash & Fold Service',
//       'Free Pickup & Delivery',
//       'Basic Packaging',
//       'Standard Cleaning Products',
//       'Email Notifications',
//       '48-hour Turnaround',
//       'Customer Support (Business Hours)'
//     ]
//   },
//   {
//     id: 'premium',
//     name: 'Premium Plan',
//     monthlyPrice: 799,
//     yearlyPrice: 7990,
//     weight: '25 KG',
//     orders: '6 orders',
//     features: [
//       'All Basic Features',
//       'Dry Cleaning Included',
//       'Express Delivery (4 hours)',
//       'Premium Packaging',
//       'Stain Removal',
//       'Fabric Softener',
//       'SMS & WhatsApp Updates',
//       '24/7 Priority Support',
//       'Free Re-wash if Not Satisfied'
//     ]
//   },
//   {
//     id: 'family',
//     name: 'Family Plan',
//     monthlyPrice: 1299,
//     yearlyPrice: 12990,
//     weight: '40 KG',
//     orders: '10 orders',
//     features: [
//       'All Premium Features',
//       'Eco-Friendly Products',
//       'Multiple Pickup Locations',
//       'Dedicated Account Manager',
//       'Same-Day Service Available',
//       'Special Care for Delicate Items',
//       'Seasonal Storage Service',
//       'Family Member Management',
//       'Bulk Order Discounts'
//     ]
//   }
// ];

// // Helper functions
// const generateOrderId = () => {
//   return `TL${Date.now()}${Math.floor(Math.random() * 1000)}`;
// };

// const calculateDeliveryDate = (pickupDate, serviceId) => {
//   const service = services.find(s => s.id === serviceId);
//   if (!service) return null;

//   const pickup = new Date(pickupDate);
//   let deliveryHours = 24; // default
  
//   if (service.deliveryTime === '48 hours') deliveryHours = 48;
//   else if (service.deliveryTime === '12 hours') deliveryHours = 12;
//   else if (service.deliveryTime === '4 hours') deliveryHours = 4;
  
//   pickup.setHours(pickup.getHours() + deliveryHours);
//   return pickup.toISOString().split('T')[0];
// };

// const calculateOrderTotal = (items, serviceId) => {
//   const service = services.find(s => s.id === serviceId);
//   if (!service) return 0;

//   let total = 0;
//   Object.entries(items).forEach(([itemName, quantity]) => {
//     if (quantity > 0) {
//       const item = service.items.find(i => i.name === itemName);
//       if (item) {
//         total += item.price * quantity;
//       }
//     }
//   });
//   return total;
// };

// // Routes

// // GET /api/laundry/services - Get all laundry services
// router.get('/services', (req, res) => {
//   try {
//     res.json({
//       success: true,
//       services
//     });
//   } catch (error) {
//     console.error('Error fetching services:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch services'
//     });
//   }
// });

// // GET /api/laundry/plans - Get all subscription plans
// router.get('/plans', (req, res) => {
//   try {
//     res.json({
//       success: true,
//       plans: subscriptionPlans
//     });
//   } catch (error) {
//     console.error('Error fetching plans:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch subscription plans'
//     });
//   }
// });

// // POST /api/laundry/order - Create a new laundry order
// router.post('/order', authenticate, async (req, res) => {
//   try {
//     console.log('Received order data:', JSON.stringify(req.body, null, 2));
    
//     const {
//       service,
//       items,
//       schedule,
//       address,
//       payment,
//       specialInstructions,
//       total,
//       // Also handle flat structure for backward compatibility
//       pickupDate,
//       pickupTime,
//       deliveryDate,
//       deliveryTime,
//       paymentMethod
//     } = req.body;

//     // Extract data from nested or flat structure
//     const extractedPickupDate = schedule?.pickupDate || pickupDate;
//     const extractedPickupTime = schedule?.pickupTime || pickupTime;
//     const extractedDeliveryDate = schedule?.deliveryDate || deliveryDate;
//     const extractedDeliveryTime = schedule?.deliveryTime || deliveryTime;
//     const extractedPaymentMethod = payment?.method || paymentMethod || 'online';

//     // Validation
//     if (!service || !items || !extractedPickupDate || !extractedPickupTime || !extractedDeliveryTime || !address) {
//       console.log('Validation failed:', {
//         service: !!service,
//         items: !!items,
//         pickupDate: !!extractedPickupDate,
//         pickupTime: !!extractedPickupTime,
//         deliveryTime: !!extractedDeliveryTime,
//         address: !!address
//       });
//       return res.status(400).json({
//         success: false,
//         message: 'Missing required fields',
//         details: {
//           service: !!service,
//           items: !!items,
//           pickupDate: !!extractedPickupDate,
//           pickupTime: !!extractedPickupTime,
//           deliveryTime: !!extractedDeliveryTime,
//           address: !!address
//         }
//       });
//     }

//     // Calculate delivery date and total
//     const calculatedDeliveryDate = extractedDeliveryDate || calculateDeliveryDate(extractedPickupDate, service);
//     const calculatedTotal = total || calculateOrderTotal(items, service);

//     if (calculatedTotal === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Order must have at least one item'
//       });
//     }

//     // Create order
//     const order = {
//       id: generateOrderId(),
//       userId: req.user.id,
//       service,
//       items,
//       pickupDate: extractedPickupDate,
//       pickupTime: extractedPickupTime,
//       deliveryDate: calculatedDeliveryDate,
//       deliveryTime: extractedDeliveryTime,
//       address,
//       paymentMethod: extractedPaymentMethod,
//       specialInstructions: specialInstructions || '',
//       total: calculatedTotal,
//       status: 'confirmed',
//       currentStage: 0,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//       timeline: [
//         {
//           status: 'confirmed',
//           title: 'Order Confirmed',
//           description: 'Your laundry order has been confirmed',
//           timestamp: new Date().toLocaleString(),
//           completed: true,
//           current: true
//         },
//         {
//           status: 'picked-up',
//           title: 'Picked Up',
//           description: 'Your clothes have been picked up',
//           timestamp: 'Pending',
//           completed: false
//         },
//         {
//           status: 'washing',
//           title: 'In Process',
//           description: 'Your clothes are being washed and cleaned',
//           timestamp: 'Pending',
//           completed: false
//         },
//         {
//           status: 'ready',
//           title: 'Ready for Delivery',
//           description: 'Your clothes are cleaned and ready',
//           timestamp: 'Pending',
//           completed: false
//         },
//         {
//           status: 'out-for-delivery',
//           title: 'Out for Delivery',
//           description: 'Your order is on the way',
//           timestamp: 'Pending',
//           completed: false
//         },
//         {
//           status: 'delivered',
//           title: 'Delivered',
//           description: 'Order delivered successfully',
//           timestamp: 'Pending',
//           completed: false
//         }
//       ]
//     };

//     laundryOrders.push(order);

//     res.status(201).json({
//       success: true,
//       message: 'Order created successfully',
//       order: order,
//       orderId: order.id
//     });

//   } catch (error) {
//     console.error('Error creating order:', error);
//     console.error('Stack trace:', error.stack);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to create order',
//       error: error.message
//     });
//   }
// });

// // GET /api/laundry/orders - Get user's laundry orders
// router.get('/orders', authenticate, (req, res) => {
//   try {
//     const userOrders = laundryOrders.filter(order => order.userId === req.user.id);
    
//     res.json({
//       success: true,
//       orders: userOrders.map(order => ({
//         id: order.id,
//         service: order.service,
//         total: order.total,
//         status: order.status,
//         pickupDate: order.pickupDate,
//         deliveryDate: order.deliveryDate,
//         createdAt: order.createdAt
//       }))
//     });
//   } catch (error) {
//     console.error('Error fetching orders:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch orders'
//     });
//   }
// });

// // GET /api/laundry/order/:orderId - Get specific order details
// router.get('/order/:orderId', (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const order = laundryOrders.find(o => o.id === orderId);

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       });
//     }

//     // If user is authenticated, check if they own this order
//     if (req.user && order.userId !== req.user.id) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied'
//       });
//     }

//     res.json({
//       success: true,
//       order
//     });

//   } catch (error) {
//     console.error('Error fetching order:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch order details'
//     });
//   }
// });

// // PATCH /api/laundry/order/:orderId/status - Update order status (Admin only)
// router.patch('/order/:orderId/status', [authenticate, authorize('admin')], (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { status, stage } = req.body;

//     const orderIndex = laundryOrders.findIndex(o => o.id === orderId);
//     if (orderIndex === -1) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       });
//     }

//     const order = laundryOrders[orderIndex];
    
//     // Update order status
//     order.status = status;
//     order.currentStage = stage;
//     order.updatedAt = new Date().toISOString();

//     // Update timeline
//     if (order.timeline[stage]) {
//       order.timeline[stage].completed = true;
//       order.timeline[stage].timestamp = new Date().toLocaleString();
//       order.timeline[stage].current = false;

//       // Set current stage
//       if (stage < order.timeline.length - 1) {
//         order.timeline[stage + 1].current = true;
//       }
//     }

//     res.json({
//       success: true,
//       message: 'Order status updated successfully',
//       order
//     });

//   } catch (error) {
//     console.error('Error updating order status:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update order status'
//     });
//   }
// });

// // POST /api/laundry/subscription - Create subscription
// router.post('/subscription', authenticate, (req, res) => {
//   try {
//     const { planId, billingCycle, paymentMethod } = req.body;

//     const plan = subscriptionPlans.find(p => p.id === planId);
//     if (!plan) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid subscription plan'
//       });
//     }

//     const subscription = {
//       id: `SUB${Date.now()}`,
//       userId: req.user.id,
//       planId,
//       plan: plan.name,
//       billingCycle: billingCycle || 'monthly',
//       price: billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice,
//       paymentMethod: paymentMethod || 'online',
//       status: 'active',
//       startDate: new Date().toISOString(),
//       nextBilling: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
//       createdAt: new Date().toISOString()
//     };

//     subscriptions.push(subscription);

//     res.status(201).json({
//       success: true,
//       message: 'Subscription created successfully',
//       subscription
//     });

//   } catch (error) {
//     console.error('Error creating subscription:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to create subscription'
//     });
//   }
// });

// // GET /api/laundry/subscriptions - Get user subscriptions
// router.get('/subscriptions', authenticate, (req, res) => {
//   try {
//     const userSubscriptions = subscriptions.filter(sub => sub.userId === req.user.id);
    
//     res.json({
//       success: true,
//       subscriptions: userSubscriptions
//     });
//   } catch (error) {
//     console.error('Error fetching subscriptions:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch subscriptions'
//     });
//   }
// });

// // Admin Routes

// // GET /api/laundry/admin/orders - Get all orders (Admin only)
// router.get('/admin/orders', [authenticate, authorize('admin')], (req, res) => {
//   try {
//     const { status, page = 1, limit = 20 } = req.query;
    
//     let filteredOrders = laundryOrders;
//     if (status) {
//       filteredOrders = laundryOrders.filter(order => order.status === status);
//     }

//     const startIndex = (page - 1) * limit;
//     const endIndex = startIndex + parseInt(limit);
//     const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

//     res.json({
//       success: true,
//       orders: paginatedOrders,
//       total: filteredOrders.length,
//       page: parseInt(page),
//       totalPages: Math.ceil(filteredOrders.length / limit)
//     });

//   } catch (error) {
//     console.error('Error fetching admin orders:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch orders'
//     });
//   }
// });

// // GET /api/laundry/admin/analytics - Get laundry analytics (Admin only)
// router.get('/admin/analytics', [authenticate, authorize('admin')], (req, res) => {
//   try {
//     const totalOrders = laundryOrders.length;
//     const totalRevenue = laundryOrders.reduce((sum, order) => sum + order.total, 0);
//     const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;
    
//     const statusBreakdown = laundryOrders.reduce((acc, order) => {
//       acc[order.status] = (acc[order.status] || 0) + 1;
//       return acc;
//     }, {});

//     const serviceBreakdown = laundryOrders.reduce((acc, order) => {
//       acc[order.service] = (acc[order.service] || 0) + 1;
//       return acc;
//     }, {});

//     res.json({
//       success: true,
//       analytics: {
//         totalOrders,
//         totalRevenue,
//         activeSubscriptions,
//         statusBreakdown,
//         serviceBreakdown,
//         averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching analytics:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch analytics'
//     });
//   }
// });

// module.exports = router;
const express = require('express');
const router = express.Router();

// Controllers
const vendorController = require('../controllers/laundryVendorController');
const orderController = require('../controllers/laundryOrderController');
const subscriptionController = require('../controllers/laundrySubscriptionController');

// Middleware (use consolidated middlewares)
const { authenticate } = require('../middlewares/auth');
const { validateOrder, validateSubscription } = require('../middleware/laundryValidation');

// ==================== VENDOR ROUTES ====================

// Public routes
router.get('/vendors', vendorController.getVendors);
router.get('/vendors/nearby', vendorController.getNearbyVendors);
router.post('/vendors/check-availability', vendorController.checkAvailability);

// Protected vendor routes (must be before /vendors/:id to avoid route conflicts)
router.use(authenticate); // All routes below require authentication

// Get current user's vendor profile (MUST be before /vendors/:id)
router.get('/vendors/me', vendorController.getMyVendor);

// Vendor creation (sellers can create their own profile)
router.post('/vendors', vendorController.createVendor);

// Vendor management routes with 'me' support (MUST be before /vendors/:id)
router.patch('/vendors/me/pricing', vendorController.updatePricing);
router.patch('/vendors/me/services', vendorController.updateServices);
router.patch('/vendors/me/quick-service', vendorController.updateQuickServiceConfig);
router.patch('/vendors/me/scheduled-service', vendorController.updateScheduledServiceConfig);
router.post('/vendors/me/plans', vendorController.addOrUpdatePlan);
router.delete('/vendors/me/plans/:planId', vendorController.deletePlan);

// Vendor subscription management routes
router.get('/vendors/me/subscriptions', subscriptionController.getVendorSubscriptions);
router.get('/vendors/me/subscriptions/:id', subscriptionController.getVendorSubscription);

// Public vendor routes (by ID)
router.get('/vendors/:id', vendorController.getVendor);
router.get('/vendors/:id/plans', vendorController.getVendorPlans);

// Admin/Protected vendor routes (by ID)
router.put('/vendors/:id', authenticate, vendorController.updateVendor);
router.delete('/vendors/:id', authenticate, vendorController.deleteVendor);
router.patch('/vendors/:id/pricing', authenticate, vendorController.updatePricing);
router.patch('/vendors/:id/services', authenticate, vendorController.updateServices);
router.patch('/vendors/:id/quick-service', authenticate, vendorController.updateQuickServiceConfig);
router.patch('/vendors/:id/scheduled-service', authenticate, vendorController.updateScheduledServiceConfig);
router.post('/vendors/:id/plans', authenticate, vendorController.addOrUpdatePlan);
router.delete('/vendors/:id/plans/:planId', authenticate, vendorController.deletePlan);

// ==================== ORDER ROUTES ====================

// Price calculation (public)
router.post('/calculate-price', orderController.calculatePrice);

// Additional protected routes (vendors/me is already defined above)

router.post('/orders', validateOrder, orderController.createOrder);
router.get('/orders', orderController.getUserOrders); // Works for both users and vendors
router.get('/orders/vendor/me', orderController.getUserOrders); // Alias for vendor orders
router.get('/orders/:id', orderController.getOrder);
router.get('/orders/:id/track', orderController.trackOrder);
router.post('/orders/:id/cancel', orderController.cancelOrder);
router.post('/orders/:id/feedback', orderController.submitFeedback);

// Vendor/Admin routes
router.patch('/orders/:id/status', orderController.updateOrderStatus);

// ==================== SUBSCRIPTION ROUTES ====================

router.post('/subscriptions', validateSubscription, subscriptionController.createSubscription);
router.get('/subscriptions', subscriptionController.getUserSubscriptions);
router.get('/subscriptions/:id', subscriptionController.getSubscription);
router.patch('/subscriptions/:id/preferences', subscriptionController.updatePreferences);
router.post('/subscriptions/:id/pause', subscriptionController.pauseSubscription);
router.post('/subscriptions/:id/resume', subscriptionController.resumeSubscription);
router.post('/subscriptions/:id/cancel', subscriptionController.cancelSubscription);
router.patch('/subscriptions/:id/auto-renewal', subscriptionController.toggleAutoRenewal);

module.exports = router;