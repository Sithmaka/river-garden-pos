/**
 * Login Page Component
 *
 * Provides email/password login form with error handling and loading states.
 * Integrates with AuthContext for authentication.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/logo.png";
import riverGardenLogo from "../assets/logo1.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, loading } = useAuth();
  const navigate = useNavigate();

  /**
   * Map auth errors to user-friendly messages
   */
  const getErrorMessage = (error) => {
    if (!error) return null;

    const errorCode = error.code || error.message;

    const errorMessages = {
      invalid_credentials: "Invalid email or password",
      "Invalid login credentials": "Invalid email or password",
      email_not_confirmed: "Please confirm your email address",
      user_not_found: "No account found with this email",
      "auth/invalid-credential": "Invalid email or password",
      "auth/user-not-found": "No account found with this email",
      "auth/wrong-password": "Invalid email or password",
      "auth/invalid-email": "Invalid email address",
      "auth/too-many-requests": "Too many attempts. Please try again later",
      "auth/network-request-failed":
        "Network error. Please check your connection.",
    };

    if (error.message && error.message.toLowerCase().includes("fetch")) {
      return "Network error. Please check your connection.";
    }

    return errorMessages[errorCode] || error.message || "Login failed. Please try again.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(getErrorMessage(signInError));
        setIsSubmitting(false);
        return;
      }

      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-teal-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-t-4 border-teal-500">
        <div className="text-center mb-6">
          <img
            src={riverGardenLogo}
            alt="River Garden Resort"
            className="h-32 mx-auto mb-4"
          />
          <p className="text-gray-500 text-xs">Restaurant POS System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isSubmitting || loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={isSubmitting || loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="w-full bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting || loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center">
            <img
              src={logo}
              alt="Powered by Codebell"
              className="h-8 opacity-60"
            />
          </div>
        </div>
      </div>
    </div>
  );
}