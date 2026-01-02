// src/hooks/useToast.js
import { useDispatch } from 'react-redux';
import { addToast, removeToast } from '../storee/Slices/uiSlice';

export const useToast = () => {
  const dispatch = useDispatch();

  const showToast = (message, type = 'info', duration = 5000) => {
    const toastId = Date.now() + Math.random();
    
    dispatch(addToast({
      id: toastId,
      message,
      type,
      duration
    }));

    if (duration > 0) {
      setTimeout(() => {
        dispatch(removeToast(toastId));
      }, duration);
    }

    return toastId;
  };

  const hideToast = (toastId) => {
    dispatch(removeToast(toastId));
  };

  return {
    success: (message, duration) => showToast(message, 'success', duration),
    error: (message, duration) => showToast(message, 'error', duration),
    warning: (message, duration) => showToast(message, 'warning', duration),
    info: (message, duration) => showToast(message, 'info', duration),
    hideToast
  };
};