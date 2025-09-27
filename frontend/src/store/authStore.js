import { create } from 'zustand';
import axios from 'axios';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  
  login: async (username, password) => {
    set({ loading: true });
    try {
      console.log('Starting login process...');
      
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      console.log('Sending login request to /auth/token');
      
      const response = await axios.post('/auth/token', formData);
      const { access_token } = response.data;
      
      console.log('Login API successful, token received');
      
      // Get user info
      const userResponse = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      console.log('User info API successful:', userResponse.data);
      
      set({
        user: userResponse.data,
        token: access_token,
        isAuthenticated: true,
        loading: false
      });
      
      console.log('Auth state updated successfully');
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      set({ loading: false });
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message || 'Login failed' 
      };
    }
  },
  
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  checkAuth: async () => {
    const { token } = get();
    if (!token) return false;
    
    try {
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set({ user: response.data, isAuthenticated: true });
      return true;
    } catch (error) {
      set({ user: null, token: null, isAuthenticated: false });
      return false;
    }
  },
  
  clearAuth: () => {
    set({ user: null, token: null, isAuthenticated: false });
  }
}));

export default useAuthStore;