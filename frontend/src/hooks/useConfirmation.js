import { useState } from 'react';

export const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({});
  const [resolvePromise, setResolvePromise] = useState(null);

  const showConfirmation = (config) => {
    return new Promise((resolve) => {
      setConfirmationConfig({
        title: "Confirm Action",
        message: "Are you sure you want to proceed?",
        confirmText: "Confirm",
        cancelText: "Cancel",
        type: "warning",
        ...config
      });
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  };

  const handleConfirm = () => {
    if (resolvePromise) {
      resolvePromise(true);
    }
    setIsOpen(false);
    setResolvePromise(null);
  };

  const handleCancel = () => {
    if (resolvePromise) {
      resolvePromise(false);
    }
    setIsOpen(false);
    setResolvePromise(null);
  };

  return {
    isOpen,
    confirmationConfig,
    showConfirmation,
    handleConfirm,
    handleCancel
  };
};

export default useConfirmation;