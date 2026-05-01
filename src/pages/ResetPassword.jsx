/**
 * Reset Password Page Component
 *
 * Handles:
 * 1. requesting a password reset email
 * 2. updating the password using Firebase reset code
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { requestPasswordReset } from "../services/authService";
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { auth } from "../services/firebase";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [oobCode, setOobCode] = useState("");

  useEffect(() => {
    async function checkResetMode() {
      try {
        const mode = searchParams.get("mode");
        const code = searchParams.get("oobCode");

        if (mode === "resetPassword" && code) {
          setLoading(true);
          setError("");

          // Verify reset code and get the related email
          const verifiedEmail = await verifyPasswordResetCode(auth, code);

          setIsResetMode(true);
          setOobCode(code);
          setAccountEmail(verifiedEmail || "");
          setMessage("You can now set a new password.");
        }
      } catch (err) {
        console.error("Error verifying password reset link:", err);
        setError(
          "This password reset link is invalid or expired. Please request a new one."
        );
        setIsResetMode(false);
      } finally {
        setLoading(false);
      }
    }

    checkResetMode();
  }, [searchParams]);

  const getErrorMessage = (err) => {
    const code = err?.code || "";
    const msg = err?.message || "";

    const map = {
      "auth/user-not-found": "No account found with this email.",
      "auth/invalid-email": "Invalid email address.",
      "auth/missing-email": "Please enter your email address.",
      "auth/network-request-failed":
        "Network error. Please check your connection.",
      "auth/expired-action-code":
        "This password reset link has expired. Please request a new one.",
      "auth/invalid-action-code":
        "This password reset link is invalid. Please request a new one.",
      "auth/weak-password": "Password should be at least 6 characters long.",
    };

    return map[code] || msg || "Something went wrong. Please try again.";
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error } = await requestPasswordReset(email);

      if (error) {
        setError(getErrorMessage(error));
      } else {
        setMessage("Password reset instructions have been sent to your email.");
      }
    } catch (err) {
      console.error("Reset request error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (!oobCode) {
        throw new Error("Missing password reset code.");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      await confirmPasswordReset(auth, oobCode, newPassword);

      setMessage("Password has been successfully updated. Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("Error resetting password:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isResetMode ? "Reset Your Password" : "Request Password Reset"}
          </h2>
          {isResetMode && accountEmail && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Resetting password for <span className="font-medium">{accountEmail}</span>
            </p>
          )}
        </div>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {message && (
          <div
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{message}</span>
          </div>
        )}

        <form
          className="mt-8 space-y-6"
          onSubmit={isResetMode ? handlePasswordReset : handleRequestReset}
        >
          {!isResetMode ? (
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="new-password" className="sr-only">
                  New Password
                </label>
                <input
                  id="new-password"
                  name="new-password"
                  type="password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="sr-only">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : isResetMode
                ? "Reset Password"
                : "Send Reset Instructions"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}