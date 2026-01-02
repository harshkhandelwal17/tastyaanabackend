import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

// Category time restrictions configuration
const CATEGORY_TIME_RESTRICTIONS = {
  // Format: categoryId: { start: 'HH:MM', end: 'HH:MM' }
  '123456789': { start: '09:00', end: '21:00' }, // Example: 9 AM to 9 PM
  '688fb41ebea1c163a6eda193': { start: '10:00', end: '22:00' }, // Example: 10 AM to 10 PM
  // Add more categories as needed
};

export const useCategoryTimeRestriction = () => {
  const isWithinTimeRange = useCallback((startTime, endTime) => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    // Convert current time to minutes since midnight for easier comparison
    const currentTotalMinutes = currentHours * 60 + currentMinutes;
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    return currentTotalMinutes >= startTotalMinutes && 
           currentTotalMinutes <= endTotalMinutes;
  }, []);

  const checkCategoryTimeRestriction = useCallback((categoryId) => {
    const restriction = CATEGORY_TIME_RESTRICTIONS[categoryId];
    
    // If no restriction exists for this category, allow by default
    if (!restriction) return { allowed: true };
    
    const isAllowed = isWithinTimeRange(restriction.start, restriction.end);
    
    if (!isAllowed) {
      toast.error(
        `This category can only be ordered between ${restriction.start} and ${restriction.end}.`,
        { duration: 5000 }
      );
    }
    
    return {
      allowed: isAllowed,
      message: `Ordering available between ${restriction.start} - ${restriction.end}`,
      timing: {
        start: restriction.start,
        end: restriction.end
      }
    };
  }, [isWithinTimeRange]);

  return { checkCategoryTimeRestriction };
};

export default useCategoryTimeRestriction;
