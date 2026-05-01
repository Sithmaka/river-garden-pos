/**
 * Register Page Component
 *
 * Admin-only UI for creating staff users.
 * Uses a Firebase Callable Function because creating Auth users
 * from the client would switch the current signed-in admin session.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../services/firebase";
import riverGardenLogo from "../assets/logo1.png";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("cashier");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, role: currentUserRole } = useAuth();
  const navigate = useNavigate();

  const functions = getFunctions(app);
  const createStaffUser = httpsCallable(functions, "createStaffUser");

  const validateForm = () => {
    if (!email || !password || !confirmPassword || !name || !role) {
      setError("All fields are required");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    if (!["cashier", "waiter"].includes(role)) {
      setError("Invalid role selected");
      return false;
    }

    return true;
  };

  const getErrorMessage = (err) => {
    const code = err?.code || "";
    const message = err?.message || "";

    const map = {
      "functions/permission-denied":
        "Only administrators can create new users.",
      "functions/already-exists":
        "A user with this email already exists.",
      "functions/invalid-argument":
        "Invalid user details. Please check the form.",
      "functions/unauthenticated":
        "You must be signed in as an administrator.",
      "auth/email-already-exists":
        "A user with this email already exists.",
      "auth/invalid-email": "Invalid email address.",
      "auth/weak-password": "Password must be at least 6 characters long.",
    };

    return map[code] || map[message] || message || "Failed to create user.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) return;

    if (!user) {
      setError("You must be signed in.");
      return;
    }

    if (currentUserRole !== "admin") {
      setError("Only administrators can create new users.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createStaffUser({
        email: email.trim(),
        password,
        name: name.trim(),
        role,
      });

      setSuccess(true);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setName("");
      setRole("cashier");

      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Registration error:", err);
      setError(getErrorMessage(err));
    } finally {
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
            className="h-20 mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-800">Create New User</h2>
          <p className="text-gray-500 text-sm">Add a new staff member</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="John Doe"
            />
          </div>

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
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="staff@example.com"
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
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="cashier">Cashier</option>
              <option value="waiter">Waiter</option>
            </select>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
              User created successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-teal-500 text-white py-2 px-4 rounded-md hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting ? "Creating User..." : "Create User"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            disabled={isSubmitting}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Back to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}