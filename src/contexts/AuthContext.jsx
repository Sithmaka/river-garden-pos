/**
 * Authentication Context (Firebase Version)
 */

import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import * as authService from "../services/authService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      const userRole = await authService.getUserRole(firebaseUser.uid);

      setUser(firebaseUser);
      setRole(userRole);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Sign In
   */
  const signIn = async (email, password) => {
    const { data, error } = await authService.signIn(email, password);

    if (error) {
      return { data: null, error };
    }

    const role = await authService.getUserRole(data.user.uid);

    if (!role) {
      return {
        data: null,
        error: { message: "User role not found. Contact administrator." }
      };
    }

    setUser(data.user);
    setRole(role);

    return { data: { ...data, role }, error: null };
  };

  /**
   * Sign Out
   */
  const signOut = async () => {
    const { error } = await authService.signOut();

    if (!error) {
      setUser(null);
      setRole(null);
    }

    return { error };
  };

  const value = {
    user,
    role,
    loading,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}