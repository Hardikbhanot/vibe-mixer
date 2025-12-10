"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. Check if user is logged in on page load (Restores session from Cookie)
  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  const checkUserLoggedIn = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
      // credentials: 'include' sends the HttpOnly cookie to the /me endpoint
      const res = await fetch(`${apiUrl}/api/auth/me`, { credentials: 'include' });
      
      if (res.ok) {
        const data = await res.json();
        setUser(data.user); // Restore user data (e.g. email, id)
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Session check failed", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: any, password: any) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Important: Allows server to set the cookie
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        router.push('/generate'); // Redirect after login
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  };

  const logout = async () => {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
        await fetch(`${apiUrl}/api/auth/logout`, { 
            method: 'POST', 
            credentials: 'include' 
        });
        setUser(null);
        router.push('/auth');
    } catch (error) {
        console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);