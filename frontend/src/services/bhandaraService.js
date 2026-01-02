import apiClient from '../redux/api/apiClient';

class BhandaraService {
  // Helper method to get auth headers
  static getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Get all approved Bhandaras
  static async getAllBhandaras(params = {}) {
    try {
      const queryParams = new URLSearchParams({
        status: 'approved',
        limit: 50,
        skip: 0,
        ...params
      });

      const response = await apiClient.get(`/bhandaras?${queryParams}`);
      return {
        success: true,
        data: response.data.data,
        total: response.data.total,
        hasMore: response.data.hasMore
      };
    } catch (error) {
      console.error('Error fetching Bhandaras:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch Bhandaras',
        data: [],
        total: 0,
        hasMore: false
      };
    }
  }

  // Get upcoming Bhandaras (next 7 days)
  static async getUpcomingBhandaras() {
    try {
      const response = await apiClient.get('/bhandaras/upcoming');
      return {
        success: true,
        data: response.data.data,
        count: response.data.count
      };
    } catch (error) {
      console.error('Error fetching upcoming Bhandaras:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch upcoming Bhandaras',
        data: [],
        count: 0
      };
    }
  }

  // Get Bhandara by ID
  static async getBhandaraById(id) {
    try {
      const response = await apiClient.get(`/bhandaras/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching Bhandara:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch Bhandara',
        data: null
      };
    }
  }

  // Create new Bhandara
  static async createBhandara(bhandaraData) {
    try {
      // Validate required fields before sending (contact is now optional)
      const requiredFields = ['title', 'location', 'dateTimeStart', 'dateTimeEnd', 'organizerName'];
      const missingFields = requiredFields.filter(field => {
        if (field === 'location') {
          return !bhandaraData.location?.address;
        }
        return !bhandaraData[field];
      });

      if (missingFields.length > 0) {
        return {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
          data: null
        };
      }

      // Validate dates
      const startDate = new Date(bhandaraData.dateTimeStart);
      const endDate = new Date(bhandaraData.dateTimeEnd);
      const now = new Date();

      if (startDate <= now) {
        return {
          success: false,
          error: 'Start time must be in the future',
          data: null
        };
      }

      if (endDate <= startDate) {
        return {
          success: false,
          error: 'End time must be after start time',
          data: null
        };
      }

      // Validate contact number (Indian mobile number)
      const contactRegex = /^[6-9]\d{9}$/;
      if (!contactRegex.test(bhandaraData.contact)) {
        return {
          success: false,
          error: 'Please enter a valid 10-digit mobile number',
          data: null
        };
      }

      const response = await apiClient.post('/bhandaras', bhandaraData);
      return {
        success: true,
        message: response.data.message,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error creating Bhandara:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit Bhandara';
      const errors = error.response?.data?.errors || [];
      
      return {
        success: false,
        error: errorMessage,
        errors: errors,
        data: null
      };
    }
  }

  // Search Bhandaras (future feature)
  static async searchBhandaras(searchTerm) {
    try {
      const queryParams = new URLSearchParams({
        status: 'approved',
        search: searchTerm,
        limit: 20
      });

      const response = await apiClient.get(`/bhandaras?${queryParams}`);
      return {
        success: true,
        data: response.data.data,
        total: response.data.total
      };
    } catch (error) {
      console.error('Error searching Bhandaras:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to search Bhandaras',
        data: [],
        total: 0
      };
    }
  }

  // Validate form data
  static validateBhandaraForm(formData) {
    const errors = {};

    // Title validation
    if (!formData.title?.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      errors.title = 'Title must be at least 10 characters long';
    } else if (formData.title.length > 200) {
      errors.title = 'Title must be less than 200 characters';
    }

    // Description validation
    if (formData.description && formData.description.length > 1000) {
      errors.description = 'Description must be less than 1000 characters';
    }

    // Location validation
    if (!formData.location?.address?.trim()) {
      errors.location = 'Address is required';
    } else if (formData.location.address.length < 10) {
      errors.location = 'Please provide a detailed address (at least 10 characters)';
    }

    // Date validation
    const now = new Date();
    const startDate = new Date(formData.dateTimeStart);
    const endDate = new Date(formData.dateTimeEnd);

    if (!formData.dateTimeStart) {
      errors.dateTimeStart = 'Start date and time is required';
    } else if (startDate <= now) {
      errors.dateTimeStart = 'Start time must be in the future';
    }

    if (!formData.dateTimeEnd) {
      errors.dateTimeEnd = 'End date and time is required';
    } else if (endDate <= startDate) {
      errors.dateTimeEnd = 'End time must be after start time';
    }

    // Check if event duration is reasonable (max 12 hours)
    if (startDate && endDate) {
      const durationHours = (endDate - startDate) / (1000 * 60 * 60);
      if (durationHours > 12) {
        errors.dateTimeEnd = 'Event duration cannot exceed 12 hours';
      }
    }

    // Organizer name validation
    if (!formData.organizerName?.trim()) {
      errors.organizerName = 'Organizer name is required';
    } else if (formData.organizerName.length < 2) {
      errors.organizerName = 'Organizer name must be at least 2 characters';
    }

    // Contact validation (optional)
    if (formData.contact?.trim()) {
      if (!/^[6-9]\d{9}$/.test(formData.contact)) {
        errors.contact = 'Please enter a valid 10-digit mobile number starting with 6-9';
      }
    }

    // Food items validation (optional but if provided, should be valid)
    if (formData.foodItems && Array.isArray(formData.foodItems)) {
      if (formData.foodItems.some(item => item.trim().length === 0)) {
        errors.foodItems = 'Please remove empty food items';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Like a Bhandara
  static async likeBhandara(id) {
    try {
      const response = await apiClient.post(`/bhandaras/${id}/like`, {}, {
        headers: this.getAuthHeaders()
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error liking Bhandara:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to like Bhandara'
      };
    }
  }

  // Dislike a Bhandara
  static async dislikeBhandara(id) {
    try {
      const response = await apiClient.post(`/bhandaras/${id}/dislike`, {}, {
        headers: this.getAuthHeaders()
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error disliking Bhandara:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to dislike Bhandara'
      };
    }
  }

  // Get feedback status for a Bhandara
  static async getBhandaraFeedback(id) {
    try {
      const response = await apiClient.get(`/bhandaras/${id}/feedback`, {
        headers: this.getAuthHeaders()
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching Bhandara feedback:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch feedback'
      };
    }
  }
}

export default BhandaraService;