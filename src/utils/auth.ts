// Auth utility for handling JWT tokens
import { authService } from '@/services/authService';

export const getAuthToken = (): string | null => {
  return authService.getToken();
};

export const setAuthToken = (token: string): void => {
  authService.setToken(token);
};

export const removeAuthToken = async (): Promise<void> => {
  await authService.logout();
};

export const isAuthenticated = (): boolean => {
  return authService.isAuthenticated();
};

// For backward compatibility - returns empty string if no token
export const getAuthTokenString = (): string => {
  return authService.getToken() || '';
}; 