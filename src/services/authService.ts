const DEFAULT_API = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
  ? 'http://localhost:5000/api'
  : 'https://ascendskills.onrender.com/api';
const resolvedBaseUrl = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API).replace(/\/$/, '');

interface LoginData {
  email: string;
  password: string;
}

interface SignupData {
  name: string;
  email: string;
  phone: string;
  college: string;
  degree: string;
  yearOfCompletion: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  };
}

class AuthService {
  private token: string | null = null;

  constructor() {
    // Try to load token from localStorage
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        this.token = storedToken;
      }
    }
  }

  async login(credentials: LoginData): Promise<AuthResponse> {
    try {
      // Use the debug login endpoint
      const response = await fetch(`${resolvedBaseUrl}/auth/debug-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.success && data.data?.token) {
        this.setToken(data.data.token);
        return data as AuthResponse;
      }

      // Extract detailed validation or error messages
      const detailedMessage = Array.isArray(data?.errors)
        ? data.errors.map((e: any) => e.message).join('. ')
        : (data?.message || 'Login failed');

      return { success: false, message: detailedMessage } as AuthResponse;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error occurred' } as AuthResponse;
    }
  }

  async signup(userData: SignupData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${resolvedBaseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok && data.success && data.data?.token) {
        this.setToken(data.data.token);
        return data as AuthResponse;
      }

      // Extract detailed validation or error messages
      const detailedMessage = Array.isArray(data?.errors)
        ? data.errors.map((e: any) => e.message).join('. ')
        : (data?.message || 'Signup failed');

      return { success: false, message: detailedMessage } as AuthResponse;
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: 'Network error occurred',
      } as AuthResponse;
    }
  }

  logout(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    // Always check localStorage to ensure we have the latest token
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken && storedToken !== this.token) {
        this.token = storedToken;
      }
    }
    return this.token;
  }

  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  async validateToken(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    try {
      // Try to refresh the token
      const response = await fetch(`${resolvedBaseUrl}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.token) {
          this.setToken(data.data.token);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      if (!this.token) return false;
      
      const response = await fetch(`${resolvedBaseUrl}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.token) {
          this.setToken(data.data.token);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }
}

export const authService = new AuthService(); 