// utils/routePermissions.js
export const checkRoutePermission = (route, userRole, isAuthenticated) => {
    // Public routes are always accessible
    if (!route.protected && !route.roles) {
      return true;
    }
  
    // Protected routes require authentication
    if (route.protected && !isAuthenticated) {
      return false;
    }
  
    // Role-based routes
    if (route.roles && route.roles.length > 0) {
      return isAuthenticated && route.roles.includes(userRole);
    }
  
    return isAuthenticated;
  };