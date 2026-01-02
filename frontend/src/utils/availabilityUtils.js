/**
 * Utility functions for checking product availability based on time and day
 */

/**
 * Get current day name in lowercase
 * @returns {string} Current day name (monday, tuesday, etc.)
 */
export const getCurrentDay = () => {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
};

/**
 * Get current time in HH:MM format
 * @returns {string} Current time (e.g., "14:30")
 */
export const getCurrentTime = () => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

/**
 * Convert time string to minutes for comparison
 * @param {string} timeStr - Time in HH:MM format
 * @returns {number} Time in minutes since midnight
 */
export const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Check if a specific day is available based on availability days setting
 * @param {string} availabilityDays - Days setting ('all', 'weekdays', etc.)
 * @param {string} day - Day to check
 * @returns {boolean} Whether the day is available
 */
export const isDayAvailable = (availabilityDays, day) => {
  if (availabilityDays === 'all') return true;
  if (availabilityDays === day) return true;
  
  if (availabilityDays === 'weekdays') {
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day);
  }
  
  if (availabilityDays === 'weekends') {
    return ['saturday', 'sunday'].includes(day);
  }
  
  return false;
};

/**
 * Check if product is available at current time
 * @param {Object} product - Product object with availability object
 * @returns {Object} { isAvailable: boolean, message: string, nextAvailable: object|null }
 */
export const checkProductAvailability = (product) => {
  if (!product || !product.availability) {
    return {
      isAvailable: true,
      message: 'Product is available',
      nextAvailable: null
    };
  }

  const currentDay = getCurrentDay();
  const currentTime = getCurrentTime();
  const currentMinutes = timeToMinutes(currentTime);

  // Check if current day is available
  const dayAvailable = isDayAvailable(product.availability.days, currentDay);
  
  if (!dayAvailable) {
    const nextAvailable = findNextAvailableTime(product.availability, currentDay, currentTime);
    return {
      isAvailable: false,
      message: nextAvailable 
        ? `This item is currently not available. Available on ${nextAvailable.day} between ${nextAvailable.startTime} - ${nextAvailable.endTime}`
        : 'This item is currently not available',
      nextAvailable
    };
  }

  // Check if current time is within available time range
  const startMinutes = timeToMinutes(product.availability.startTime);
  const endMinutes = timeToMinutes(product.availability.endTime);

  if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
    return {
      isAvailable: true,
      message: 'Product is currently available',
      nextAvailable: null
    };
  }

  // Find next available time
  const nextAvailable = findNextAvailableTime(product.availability, currentDay, currentTime);
  
  return {
    isAvailable: false,
    message: nextAvailable 
      ? `This item is currently not available. Available on ${nextAvailable.day} between ${nextAvailable.startTime} - ${nextAvailable.endTime}`
      : 'This item is currently not available',
    nextAvailable
  };
};

/**
 * Find the next available time slot for a product
 * @param {Object} availability - Availability object with days, startTime, endTime
 * @param {string} currentDay - Current day name
 * @param {string} currentTime - Current time in HH:MM
 * @returns {Object|null} Next available time slot or null
 */
export const findNextAvailableTime = (availability, currentDay, currentTime) => {
  const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const currentDayIndex = daysOrder.indexOf(currentDay);
  const currentMinutes = timeToMinutes(currentTime);
  const startMinutes = timeToMinutes(availability.startTime);

  // First, check if available later today
  if (isDayAvailable(availability.days, currentDay) && currentMinutes < startMinutes) {
    return {
      day: currentDay,
      startTime: availability.startTime,
      endTime: availability.endTime
    };
  }

  // Then check upcoming days
  for (let i = 1; i <= 7; i++) {
    const dayIndex = (currentDayIndex + i) % 7;
    const dayName = daysOrder[dayIndex];
    
    if (isDayAvailable(availability.days, dayName)) {
      return {
        day: dayName,
        startTime: availability.startTime,
        endTime: availability.endTime
      };
    }
  }

  return null;
};

/**
 * Get availability display text for a product
 * @param {Object} product - Product object with availability
 * @returns {string} Formatted availability text
 */
export const getAvailabilityDisplayText = (product) => {
  if (!product || !product.availability) {
    return 'Available 24/7';
  }

  const { days, startTime, endTime } = product.availability;
  
  let dayText = '';
  switch (days) {
    case 'all':
      dayText = 'Every day';
      break;
    case 'weekdays':
      dayText = 'Monday to Friday';
      break;
    case 'weekends':
      dayText = 'Saturday & Sunday';
      break;
    default:
      dayText = days.charAt(0).toUpperCase() + days.slice(1);
  }
  
  if (startTime === '00:00' && endTime === '23:59') {
    return `${dayText}: All day`;
  }
  
  return `${dayText}: ${startTime} - ${endTime}`;
};

/**
 * Check if we should show availability warning (item available but will become unavailable soon)
 * @param {Object} product - Product object
 * @param {number} warningMinutes - Minutes before unavailability to show warning (default: 30)
 * @returns {Object} { showWarning: boolean, message: string, minutesLeft: number }
 */
export const checkAvailabilityWarning = (product, warningMinutes = 30) => {
  const availability = checkProductAvailability(product);
  
  if (!availability.isAvailable || !product.availability) {
    return { showWarning: false, message: '', minutesLeft: 0 };
  }

  const currentDay = getCurrentDay();
  const currentTime = getCurrentTime();
  const currentMinutes = timeToMinutes(currentTime);

  // Check if currently available
  if (!isDayAvailable(product.availability.days, currentDay)) {
    return { showWarning: false, message: '', minutesLeft: 0 };
  }

  const startMinutes = timeToMinutes(product.availability.startTime);
  const endMinutes = timeToMinutes(product.availability.endTime);

  // Must be within available time range
  if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
    return { showWarning: false, message: '', minutesLeft: 0 };
  }

  const minutesLeft = endMinutes - currentMinutes;

  if (minutesLeft <= warningMinutes) {
    return {
      showWarning: true,
      message: `This item will become unavailable in ${minutesLeft} minutes`,
      minutesLeft
    };
  }

  return { showWarning: false, message: '', minutesLeft };
};