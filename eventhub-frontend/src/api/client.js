import axios from 'axios';
// Event service base URL
const API_BASE_URL = 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Request Interceptor: Inject JWT Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global 401 Handler
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optional: Clean up token if expired
      // localStorage.removeItem('token');
      console.warn('Unauthorized request - session may have expired.');
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth Service
  auth: {
    register: async (email, password, role = 'ROLE_CUSTOMER') => {
      const res = await apiClient.post('/api/v1/auth/register', { email, password, role });
      return res.data;
    },

    verifyOtp: async (email, otp) => {
      const res = await apiClient.post('/api/v1/auth/verify-otp', { email, otp });
      return res.data;
    },

    login: async (email, password) => {
      const res = await apiClient.post('/api/v1/auth/login', { email, password });
      return res.data;
    },
  },

  // User Profile Service
  users: {
    register: async ({ userId, email, role }) => {
      const res = await apiClient.post('/api/v1/users', { userId, email, role });
      return res.data;
    },

    getProfile: async () => {
      const res = await apiClient.get('/api/v1/users/profile');
      return res.data;
    },

    updateProfile: async (profileData) => {
      const res = await apiClient.post('/api/v1/users/profile', profileData);
      return res.data;
    },
  },

  // Event & Venue Service
  events: {
    getAll: async () => {
      const res = await apiClient.get('/api/v1/events');
      return res.data;
    },

    getById: async (id) => {
      const res = await apiClient.get(`/api/v1/events/${id}`);
      return res.data;
    },

    getSeats: async (eventId) => {
      const res = await apiClient.get(`/api/v1/events/${eventId}/seats`);
      return res.data;
    },
  },

  // Booking Service
  bookings: {
    reserveSeats: async (eventId, seatIds, userEmail) => {
      const res = await apiClient.post('/api/v1/bookings', { eventId, seatIds, userEmail });
      return res.data;
    },

    getById: async (id) => {
      const res = await apiClient.get(`/api/v1/bookings/${id}`);
      return res.data;
    },

    getUserBookings: async () => {
      const res = await apiClient.get('/api/v1/bookings/user');
      return res.data;
    },
  },

  // Payment Service
  payments: {
    getByBooking: async (bookingId) => {
      const res = await apiClient.get(`/api/v1/payments/booking/${bookingId}`);
      return res.data;
    },

    verify: async (bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
      const res = await apiClient.post('/api/v1/payments/verify', {
        bookingId: Number(bookingId),
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });
      return res.data;
    },

    fail: async (bookingId, eventId, seatIds, reason) => {
      const res = await apiClient.post('/api/v1/payments/fail', {
        bookingId: Number(bookingId),
        eventId: eventId ? Number(eventId) : null,
        seatIds,
        reason,
      });
      return res.data;
    },
  },

  // Ticket Pass Service
  tickets: {
    getByBooking: async (bookingId) => {
      const res = await apiClient.get(`/api/v1/tickets/booking/${bookingId}`);
      return res.data;
    },

    validate: async (ticketCode) => {
      const res = await apiClient.post(`/api/v1/tickets/validate?ticketCode=${ticketCode}`);
      return res.data;
    },
  },
};
