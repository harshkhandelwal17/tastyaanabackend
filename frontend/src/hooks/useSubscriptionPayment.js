// hooks/useSubscriptionPayment.js
import { useDispatch } from 'react-redux';
import { updateBalance, showWallet, fetchWalletBalance } from '../redux/walletSlice';
import { clearCart } from '../redux/cartSlice';
import toast from 'react-hot-toast';

export const useSubscriptionPayment = () => {
  const dispatch = useDispatch();

  const handleSubscriptionSuccess = async (paymentData, subscriptionData) => {
    try {
      console.log('🎉 Processing subscription success...', paymentData);

      // Extract wallet credited amount
      const creditedAmount = paymentData.walletTransaction?.amount || 
                           paymentData.subscription?.walletCredited ||
                           subscriptionData?.pricing?.finalAmount;

      if (creditedAmount) {
        // 🔥 Update Redux wallet state immediately
        dispatch(updateBalance({ 
          amount: creditedAmount, 
          type: 'credit' 
        }));
        
        // 🔥 Show wallet in navbar
        dispatch(showWallet());

        // 🔥 Fetch fresh wallet balance from server
        setTimeout(() => {
          dispatch(fetchWalletBalance());
        }, 1000);

        console.log('✅ Wallet state updated:', {
          amount: creditedAmount,
          action: 'credit'
        });
      }

      // Clear cart
      dispatch(clearCart());

      // Show success notification
      toast.success(`🎉 Subscription activated! ₹${creditedAmount} added to your wallet`, { 
        duration: 2000,
        position: 'top-center',
      });

      return {
        success: true,
        walletCredited: creditedAmount,
        subscription: paymentData.subscription
      };

    } catch (error) {
      console.error('❌ Error processing subscription success:', error);
      toast.error('Subscription created but there was an issue updating your wallet display', { duration: 2000 });
      return {
        success: false,
        error: error.message
      };
    }
  };

  return {
    handleSubscriptionSuccess
  };
};