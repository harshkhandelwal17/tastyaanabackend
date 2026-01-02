// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import cartReducer from './cartSlice';
import wishlistReducer from './wishlistSlice';
import notificationsReducer from './notificationslice';
import uiReducer from './uiSlice';
import productReducer from './productsSlice';
import mealPlanSlice from "./Slices/MealPlanSlice";
import orderReducer from "./orderSlice";
import authReducer from './authslice';
import driverReducer from './driverSlice';
import groceryReducer from './Slices/grocerySlice';
import { api } from './storee/api'; // make sure this doesn't depend on `store.js`
import groceryApi from './storee/groceryApi';
import { optimizedApi } from './storee/optimizedApi';
import walletReducer from './Slices/WalletSlice';
import laundryReducer from './Slices/laundrySlice';
import subscriptionApi from './api/subscriptionApi';
import adminsubscriptionApi from '../features/subscription/subscriptionApi';
import { sellerApi } from '../features/api/sellerApi';
import { sellerTiffinApi } from './Slices/sellerTiffinApi';
import { couponApi } from '../features/coupons/couponApi';
import { chargesApi } from '../features/charges/chargesApi';
import { laundryApi } from './api/laundryApi';
import { sellerProductApi } from './api/sellerProductApi';
import { adminPanelApi } from './api/adminPanelApi';
import { adminApi } from './api/adminApi';
import { vehicleApi } from './api/vehicleApi';
import { vehiclePublicApi } from '../api/vehiclePublicApi';
import rentARideReducer from './Slices/rentARideSlice';
import { sellerVehicleSliceApi } from './api/sellerVehicleSliceApi';

// Persist config only for auth
const persistConfig = {
  key: 'auth',
  storage,
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

// Add debugging for persist rehydration
const debugPersistReducer = (state, action) => {
  const newState = persistedAuthReducer(state, action);
  if (action.type === 'persist/REHYDRATE') {
    console.log('Persist rehydration completed:', newState);
  }
  return newState;
};

export const store = configureStore({
  reducer: {
    auth: debugPersistReducer,
    driver: driverReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    notifications: notificationsReducer,
    ui: uiReducer,
    products: productReducer,
    order: orderReducer,
    wallet: walletReducer,
    laundry: laundryReducer,
    rentARide: rentARideReducer,
    [sellerApi.reducerPath]: sellerApi.reducer,
    [sellerTiffinApi.reducerPath]: sellerTiffinApi.reducer,
    mealPlan: mealPlanSlice,
    grocery: groceryReducer,
    [api.reducerPath]: api.reducer,
    [groceryApi.reducerPath]: groceryApi.reducer,
    [optimizedApi.reducerPath]: optimizedApi.reducer,
    [subscriptionApi.reducerPath]: subscriptionApi.reducer,
    [adminsubscriptionApi.reducerPath]: adminsubscriptionApi.reducer,
    [couponApi.reducerPath]: couponApi.reducer,
    [chargesApi.reducerPath]: chargesApi.reducer,
    [laundryApi.reducerPath]: laundryApi.reducer,
    [sellerProductApi.reducerPath]: sellerProductApi.reducer,
    [adminPanelApi.reducerPath]: adminPanelApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [vehicleApi.reducerPath]: vehicleApi.reducer,
    [vehiclePublicApi.reducerPath]: vehiclePublicApi.reducer,
    [sellerVehicleSliceApi.reducerPath]: sellerVehicleSliceApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
      },
    }).concat([
      api.middleware,
      groceryApi.middleware,
      optimizedApi.middleware,
      subscriptionApi.middleware,
      sellerApi.middleware,
      sellerTiffinApi.middleware,
      adminsubscriptionApi.middleware,
      couponApi.middleware,
      chargesApi.middleware,
      laundryApi.middleware,
      sellerProductApi.middleware,
      adminPanelApi.middleware,
      adminApi.middleware,
      vehicleApi.middleware,
      vehiclePublicApi.middleware,
      sellerVehicleSliceApi.middleware,
    ]),
});

export const persistor = persistStore(store);
