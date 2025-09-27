import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      
      login: async (username, password) => {
        set({ loading: true });
        try {
          const formData = new FormData();
          formData.append('username', username);
          formData.append('password', password);
          
          const response = await axios.post('/api/auth/token', formData);
          const { access_token } = response.data;
          
          // Get user info
          const userResponse = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${access_token}` }
          });
          
          set({
            user: userResponse.data,
            token: access_token,
            isAuthenticated: true,
            loading: false
          });
          
          return { success: true };
        } catch (error) {
          set({ loading: false });
          return { 
            success: false, 
            error: error.response?.data?.detail || 'Login failed' 
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
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

export default useAuthStore;