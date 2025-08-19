const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
    // For cookie-based auth, we don't need to store token in localStorage
    // The token will be automatically sent with requests via cookies
  }

  async login(credentials: LoginData): Promise<AuthResponse> {
    try {
      // Use the debug login endpoint with credentials
      const response = await fetch(`${API_BASE_URL}/auth/debug-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success && data.data?.token) {
        // Store token in memory for immediate use (cookie will handle persistence)
        this.token = data.data.token;
        return data;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async signup(userData: SignupData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success && data.data?.token) {
        // Store token in memory for immediate use (cookie will handle persistence)
        this.token = data.data.token;
      }

      return data;
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: 'Network error occurred',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint to clear server-side session and cookie
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local token
      this.token = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token'); // Clean up any existing localStorage
      }
    }
  }

  getToken(): string | null {
    // For cookie-based auth, we return the in-memory token
    // The actual token is stored in HttpOnly cookies and sent automatically
    return this.token;
  }

  setToken(token: string): void {
    this.token = token;
    // Don't store in localStorage for security (use cookies instead)
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  async validateToken(): Promise<boolean> {
    try {
      // Validate token using cookies (no need to pass token in header)
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
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
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.token) {
          this.token = data.data.token;
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