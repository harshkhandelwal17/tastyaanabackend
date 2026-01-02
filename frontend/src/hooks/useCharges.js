import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const useCharges = () => {
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.auth);

  // Get applicable charges for cart items
  const getApplicableCharges = useCallback(async (cartItems, subtotal) => {
    if (!cartItems || cartItems.length === 0) {
      setCharges([]);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const requestData = {
        items: cartItems.map(item => ({
          category: item.category || item.product?.category || 'default',
          categoryId: item.categoryId || item.product?.categoryId,
          price: item.price || 0,
          quantity: item.quantity || 1
        })),
        subtotal: subtotal || 0,
        orderDate: new Date().toISOString()
      };
      
      console.log('Charges API Request:', requestData);
      const response = await axios.post(`${API_BASE_URL}/charges/applicable`, requestData);

      const applicableCharges = response.data.applicableCharges || [];
      console.log("applicable charges:", applicableCharges);
      setCharges(applicableCharges);
      return applicableCharges;
    } catch (err) {
      console.error('Error fetching applicable charges:', err);
      setError(err.response?.data?.message || 'Failed to fetch charges');
      setCharges([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate total charges
  const calculateTotalCharges = useCallback((charges) => {
    return charges.reduce((total, charge) => {
      return total + (charge.calculatedAmount || 0);
    }, 0);
  }, []);

  // Get charges by type
  const getChargesByType = useCallback((charges, type) => {
    return charges.filter(charge => charge.type === type);
  }, []);

  // Calculate breakdown for display
  const getChargesBreakdown = useCallback((charges) => {
    const breakdown = {
      rainCharges: 0,
      packingCharges: 0,
      taxes: 0,
      deliveryCharges: 0,
      serviceCharges: 0,
      handlingCharges: 0,
      total: 0
    };
    console.log("charges in the getchargesbreakdown: ", charges);
    charges.forEach(charge => {
      const amount = charge.calculatedAmount || 0;
      breakdown.total += amount;
      console.log(charge.chargeType,amount);
      switch (charge.chargeType) {
        case 'rain':
          breakdown.rainCharges += amount;
          break;
        case 'packing':
          breakdown.packingCharges += amount;
          break;
        case 'tax':
          breakdown.taxes += amount;
          break;
        case 'delivery':
          breakdown.deliveryCharges += amount;
          break;
        case 'service':
          breakdown.serviceCharges += amount;
          break;
        case 'handling':
          breakdown.handlingCharges += amount;
          break;
        default:
          break;
      }
    });

    return breakdown;
  }, []);

  // Check if rain charges apply (simplified weather check)
  const checkRainCharges = useCallback(() => {
    // This is a simplified check - in a real app, you'd integrate with a weather API
    const hour = new Date().getHours();
    const month = new Date().getMonth();
    
    // Simulate rain during monsoon months (June-September) and evening hours
    const isMonsoon = month >= 5 && month <= 8;
    const isEvening = hour >= 17 && hour <= 20;
    
    return isMonsoon || isEvening;
  }, []);

  return {
    charges,
    loading,
    error,
    getApplicableCharges,
    calculateTotalCharges,
    getChargesByType,
    getChargesBreakdown,
    checkRainCharges
  };
};

export default useCharges;
