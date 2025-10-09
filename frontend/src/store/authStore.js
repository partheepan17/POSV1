import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import supabase from '../lib/supabase';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      loading: false,

      login: async (email, password) => {
        set({ loading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();

          if (userError) throw userError;

          set({
            user: userData,
            session: data.session,
            isAuthenticated: true,
            loading: false
          });

          return { success: true };
        } catch (error) {
          console.error('Login error:', error);
          set({ loading: false });
          return {
            success: false,
            error: error.message || 'Login failed'
          };
        }
      },

      logout: async () => {
        try {
          await supabase.auth.signOut();
          set({ user: null, session: null, isAuthenticated: false });
        } catch (error) {
          console.error('Logout error:', error);
        }
      },

      checkAuth: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (!session) {
            set({ user: null, session: null, isAuthenticated: false });
            return false;
          }

          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .maybeSingle();

          if (error) throw error;

          set({
            user: userData,
            session: session,
            isAuthenticated: true
          });

          return true;
        } catch (error) {
          console.error('Auth check error:', error);
          set({ user: null, session: null, isAuthenticated: false });
          return false;
        }
      },

      clearAuth: () => {
        set({ user: null, session: null, isAuthenticated: false });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    (async () => {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .maybeSingle();

      useAuthStore.setState({
        user: userData,
        session: session,
        isAuthenticated: true
      });
    })();
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({
      user: null,
      session: null,
      isAuthenticated: false
    });
  }
});

export default useAuthStore;