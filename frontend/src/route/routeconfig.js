
// routes/routeConfig.js - Route configuration
export const routeConfig = {
    public: [
      { path: '/', component: 'HomePage', exact: true },
      { path: '/about', component: 'AboutPage' },
      { path: '/contact', component: 'ContactPage' },
      { path: '/products/:id', component: 'ProductPage' },
      { path: '/search', component: 'SearchResultsPage' },
      { path: '/terms', component: 'TermsConditionsPage' },
      { path: '/privacy', component: 'PrivacyPolicyPage' },
      { path: '/login', component: 'LoginPage' },
      { path: '/register', component: 'RegisterPage' },
      { path: '/forgot-password', component: 'ForgotPasswordPage' },
    ],
    buyer: [
      { path: '/buyer/cart', component: 'CartPage', protected: true },
      { path: '/buyer/checkout', component: 'CheckoutPage', protected: true },
      { path: '/buyer/orders', component: 'MyOrdersPage', protected: true },
      { path: '/buyer/order-success', component: 'OrderSuccessPage', protected: true },
      { path: '/buyer/wishlist', component: 'WishlistPage', protected: true },
      { path: '/buyer/profile', component: 'ProfilePage', protected: true },
    ],
    admin: [
      { path: '/admin', component: 'AdminDashboard', roles: ['admin', 'super-admin'] },
      { path: '/admin/products', component: 'AdminProductsPage', roles: ['admin', 'super-admin'] },
      { path: '/admin/orders', component: 'AdminOrdersPage', roles: ['admin', 'super-admin'] },
      { path: '/admin/users', component: 'AdminUsersPage', roles: ['admin', 'super-admin'] },
      { path: '/admin/analytics', component: 'AdminAnalyticsPage', roles: ['admin', 'super-admin'] },
    ],
    seller: [
      { path: '/seller', component: 'SellerDashboard', roles: ['seller', 'admin'] },
      { path: '/seller/products', component: 'SellerProductsPage', roles: ['seller', 'admin'] },
      { path: '/seller/orders', component: 'SellerOrdersPage', roles: ['seller', 'admin'] },
      { path: '/seller/orders/:orderId', component: 'OrderDetailsPage', roles: ['seller', 'admin'] },
      { path: '/seller/analytics', component: 'SellerAnalyticsDashboard', roles: ['seller', 'admin'] },
      { path: '/seller/dailyhtali', component: 'DailyThali', roles: ['seller', 'admin'] },
    ]
  };