
// Updated useApp hook
import { useSelector, useDispatch } from "react-redux";
import { 
  loginSuccess, 
  logout as authLogout 
} from "./authslice";
import { 
  addItem as addToCartAction, 
  removeItem as removeFromCartAction, 
  updateQuantity as updateCartQuantityAction 
} from "./cartSlice";
import { 
  addItem as addToWishlistAction, 
  removeItem as removeFromWishlistAction 
} from "./wishlistSlice";
import { 
  markAsRead as markNotificationAsReadAction 
} from "./notificationslice";
import { 
  toggleTheme as toggleThemeAction 
} from "./uiSlice";

const useApp = () => {
  const dispatch = useDispatch();
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items: cart, totalQuantity } = useSelector((state) => state.cart);
  const { items: wishlist } = useSelector((state) => state.wishlist);
  const { notifications } = useSelector((state) => state.notifications);
  const { theme } = useSelector((state) => state.ui);

  // Actions
  const login = (userData) => {
    dispatch(loginSuccess(userData));
  };

  const logout = () => {
    dispatch(authLogout());
  };

  const addToCart = (item) => {
    dispatch(addToCartAction(item));
  };

  const removeFromCart = (itemId) => {
    dispatch(removeFromCartAction(itemId));
  };

  const updateCartQuantity = (itemId, quantity) => {
    dispatch(updateCartQuantityAction({ id: itemId, quantity }));
  };

  const addToWishlist = (item) => {
    dispatch(addToWishlistAction(item));
  };

  const removeFromWishlist = (itemId) => {
    dispatch(removeFromWishlistAction(itemId));
  };

  const markNotificationAsRead = (notificationId) => {
    dispatch(markNotificationAsReadAction(notificationId));
  };

  const toggleTheme = () => {
    dispatch(toggleThemeAction());
  };

  return {
    user,
    cart,
    wishlist,
    notifications,
    theme,
    isAuthenticated,
    totalQuantity,
    login,
    logout,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    addToWishlist,
    removeFromWishlist,
    markNotificationAsRead,
    toggleTheme,
  };
};

export default useApp;