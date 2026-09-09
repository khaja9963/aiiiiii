import { User } from '../types';

export const authService = {
  login: async (credentials: { email?: string; password?: string }): Promise<{ data: { token: string; user: User } }> => {
    const email = credentials.email?.trim() || '';
    const password = credentials.password || '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
      throw new Error('Enter a valid email address and password.');
    }

    const name = email.split('@')[0]
      .split(/[._-]/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Recruiter';

    return {
      data: {
        token: `local-session-${Date.now()}`,
        user: {
          id: 1,
          name,
          email,
          role: 'recruiter'
        }
      }
    };
  },
  
  register: async (userData: { email?: string; password?: string }): Promise<{ data: { success: boolean } }> => {
    if (!userData.email?.trim() || !userData.password) {
      throw new Error('Email and password are required.');
    }
    return { data: { success: true } };
  }
};
