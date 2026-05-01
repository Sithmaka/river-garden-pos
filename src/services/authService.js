/**
 * Authentication Service (Firebase Version)
 */

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

/* =========================================================
   HELPERS
========================================================= */

function mapAuthError(error) {
  const code = error?.code || "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      return new Error("Invalid email or password");

    case "auth/invalid-email":
      return new Error("Invalid email address");

    case "auth/user-disabled":
      return new Error("This account has been disabled");

    case "auth/too-many-requests":
      return new Error("Too many failed attempts. Please try again later");

    case "auth/network-request-failed":
      return new Error("Network error. Please check your connection");

    case "auth/missing-password":
      return new Error("Password is required");

    case "auth/requires-recent-login":
      return new Error("Please log in again before changing your password");

    default:
      return new Error(error?.message || "Authentication failed");
  }
}

/* =========================================================
   AUTH
========================================================= */

/**
 * Sign in with email + password
 */
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    const user = userCredential.user;

    return {
      data: {
        user,
        session: userCredential,
      },
      error: null,
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      data: null,
      error: mapAuthError(error),
    };
  }
}

/**
 * Request password reset email
 */
export async function requestPasswordReset(email) {
  try {
    await sendPasswordResetEmail(auth, email.trim());

    return {
      data: { message: "Password reset email sent" },
      error: null,
    };
  } catch (error) {
    console.error("Password reset error:", error);
    return {
      data: null,
      error: mapAuthError(error),
    };
  }
}

/**
 * Update password for currently signed-in user
 */
export async function updatePasswordWithToken(newPassword) {
  try {
    const user = auth.currentUser;

    if (!user) {
      return {
        data: null,
        error: new Error("No authenticated user"),
      };
    }

    await updatePassword(user, newPassword);

    return {
      data: { message: "Password updated successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Update password error:", error);
    return {
      data: null,
      error: mapAuthError(error),
    };
  }
}

/**
 * Reauthenticate current user before sensitive actions
 */
export async function reauthenticateCurrentUser(currentPassword) {
  try {
    const user = auth.currentUser;

    if (!user || !user.email) {
      return {
        data: null,
        error: new Error("No authenticated user"),
      };
    }

    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );

    await reauthenticateWithCredential(user, credential);

    return {
      data: { message: "Reauthentication successful" },
      error: null,
    };
  } catch (error) {
    console.error("Reauthentication error:", error);
    return {
      data: null,
      error: mapAuthError(error),
    };
  }
}

/**
 * Sign out
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth);

    // only remove app-specific cached values if needed
    try {
      sessionStorage.removeItem("userRole");
      localStorage.removeItem("userRole");
    } catch (storageError) {
      console.warn("Storage cleanup warning:", storageError);
    }

    return { error: null };
  } catch (error) {
    console.error("Sign out error:", error);
    return {
      error: mapAuthError(error),
    };
  }
}

/**
 * Get current Firebase user
 */
export function getCurrentUser() {
  try {
    return auth.currentUser;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

/**
 * Get user role from Firestore users collection
 */
export async function getUserRole(userId) {
  try {
    const docRef = doc(db, "users", userId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      console.warn("User document not found:", userId);
      return null;
    }

    const data = snapshot.data();
    return data?.role || null;
  } catch (error) {
    console.error("Error fetching role:", error);
    return null;
  }
}

/**
 * Get current user profile + role
 */
export async function getCurrentUserProfile() {
  const user = getCurrentUser();

  if (!user) {
    return { user: null, role: null };
  }

  const role = await getUserRole(user.uid);

  return { user, role };
}