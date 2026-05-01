import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, app } from "../services/firebase";
import Button from "../components/ui/Button";

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);

  const [newRole, setNewRole] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [modalError, setModalError] = useState("");

  const { user: currentUser, role: currentUserRole } = useAuth();
  const navigate = useNavigate();

  const functions = getFunctions(app);
  const adminSendPasswordReset = httpsCallable(
    functions,
    "adminSendPasswordReset"
  );
  const adminRemoveUserAccess = httpsCallable(
    functions,
    "adminRemoveUserAccess"
  );
  const adminChangeUserRole = httpsCallable(functions, "adminChangeUserRole");

  useEffect(() => {
    fetchUsers();
  }, [currentUser?.uid, currentUserRole]);

  const getErrorMessage = (err) => {
    const code = err?.code || "";
    const message = err?.message || "";

    const map = {
      "functions/permission-denied": "Only administrators can perform this action.",
      "functions/unauthenticated": "You must be signed in as an administrator.",
      "functions/not-found": "The selected user no longer exists.",
      "functions/invalid-argument": "Invalid data provided.",
      "functions/already-exists": "That change cannot be completed because the user already exists.",
      "auth/user-not-found": "User not found.",
      "auth/invalid-email": "Invalid email address.",
    };

    return map[code] || map[message] || message || "Something went wrong.";
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setAdminPassword("");
    setModalError("");
    setSelectedUser(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setAdminPassword("");
    setModalError("");
    setSelectedUser(null);
  };

  const closeRoleModal = () => {
    setShowChangeRoleModal(false);
    setNewRole("");
    setModalError("");
    setSelectedUser(null);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!currentUser?.uid) {
        throw new Error("No authenticated user");
      }

      if (currentUserRole !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("role"), orderBy("email"));
      const snapshot = await getDocs(q);

      const userData = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        return {
          id: docSnap.id,
          uid: docSnap.id,
          email: data.email || "",
          name: data.name || data.fullName || "",
          role: data.role || "cashier",
          isActive: data.isActive !== false,
          created_at:
            typeof data.createdAt?.toDate === "function"
              ? data.createdAt.toDate().toISOString()
              : data.createdAt || null,
        };
      });

      setUsers(userData);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const isCurrentUser = (userId) => userId === currentUser?.uid;
  const canDeleteUser = (userId) => userId !== currentUser?.uid;

  const handleResetPassword = async () => {
    try {
      setIsUpdating(true);
      setModalError("");

      if (!selectedUser?.id || !selectedUser?.email) {
        setModalError("No user selected");
        return;
      }

      if (!adminPassword) {
        setModalError("Your admin password is required");
        return;
      }

      await adminSendPasswordReset({
        targetUserId: selectedUser.id,
        targetEmail: selectedUser.email,
        adminPassword,
      });

      setSuccessMessage(
        `Password reset link sent to ${selectedUser.email}.`
      );
      closeResetModal();
    } catch (err) {
      console.error("Reset password error:", err);
      setModalError(getErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setIsUpdating(true);
      setModalError("");

      if (!selectedUser?.id) {
        setModalError("Invalid user");
        return;
      }

      await adminRemoveUserAccess({
        targetUserId: selectedUser.id,
      });

      setSuccessMessage("User access removed successfully");
      closeDeleteModal();
      fetchUsers();
    } catch (err) {
      console.error("Remove user error:", err);
      setModalError(getErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangeRole = async () => {
    try {
      setIsUpdating(true);
      setModalError("");

      if (!selectedUser?.id) {
        setModalError("No user selected");
        return;
      }

      if (!newRole) {
        setModalError("Please select a new role");
        return;
      }

      if (newRole === selectedUser.role) {
        setModalError("Please select a different role");
        return;
      }

      await adminChangeUserRole({
        targetUserId: selectedUser.id,
        newRole,
      });

      setSuccessMessage(`User role changed to ${newRole} successfully`);
      closeRoleModal();
      fetchUsers();
    } catch (err) {
      console.error("Change role error:", err);
      setModalError(getErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-cyan-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
            <p className="text-gray-600 mt-2">
              Manage staff accounts and permissions
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate("/admin/dashboard")}
              className="bg-gray-500 hover:bg-gray-600"
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={() => navigate("/admin/register")}
              className="bg-teal-500 hover:bg-teal-600"
            >
              Add New User
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
            {successMessage}
          </div>
        )}

        {showResetModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h3 className="text-xl font-bold mb-2">Reset User Password</h3>
              {selectedUser && (
                <p className="text-sm text-gray-600 mb-4">
                  Resetting password for: <strong>{selectedUser.email}</strong>
                </p>
              )}

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                  A password reset link will be sent to the user's email address.
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Your Admin Password
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter your password to confirm"
                  />
                </div>

                {modalError && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {modalError}
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeResetModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={isUpdating || !adminPassword}
                    className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:bg-gray-400"
                  >
                    {isUpdating ? "Sending..." : "Send Reset Email"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Remove User Access</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to remove access for this user?
              </p>

              {selectedUser && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-gray-600">
                    <strong>User:</strong> {selectedUser.email}
                  </p>
                </div>
              )}

              {modalError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-4">
                  {modalError}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400"
                >
                  {isUpdating ? "Removing..." : "Remove User"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showChangeRoleModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Change User Role</h3>
              {selectedUser && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>User:</strong> {selectedUser.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Current Role:</strong> {selectedUser.role}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select New Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Choose a role...</option>
                    <option value="admin">Admin</option>
                    <option value="cashier">Cashier</option>
                    <option value="waiter">Waiter</option>
                  </select>
                </div>

                {newRole && newRole === selectedUser?.role && (
                  <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-md">
                    This user already has this role.
                  </div>
                )}

                {modalError && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {modalError}
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeRoleModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangeRole}
                    disabled={isUpdating || !newRole || newRole === selectedUser?.role}
                    className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:bg-gray-400"
                  >
                    {isUpdating ? "Updating..." : "Update Role"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((userItem) => (
                  <tr key={userItem.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {userItem.email}
                        </span>
                        <span className="text-sm text-gray-500">
                          Created:{" "}
                          {userItem.created_at
                            ? new Date(userItem.created_at).toLocaleDateString()
                            : "-"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          userItem.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : userItem.role === "cashier"
                            ? "bg-teal-100 text-teal-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {userItem.role}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2 flex-wrap">
                        {userItem.role !== "admin" && (
                          <button
                            onClick={() => {
                              setSelectedUser(userItem);
                              setModalError("");
                              setAdminPassword("");
                              setShowResetModal(true);
                            }}
                            disabled={isUpdating}
                            className="text-teal-600 hover:text-teal-900"
                          >
                            Reset Password
                          </button>
                        )}

                        {!isCurrentUser(userItem.id) && (
                          <button
                            onClick={() => {
                              setSelectedUser(userItem);
                              setNewRole("");
                              setModalError("");
                              setShowChangeRoleModal(true);
                            }}
                            disabled={isUpdating}
                            className="text-blue-600 hover:text-blue-900 ml-4"
                          >
                            Change Role
                          </button>
                        )}

                        {canDeleteUser(userItem.id) && (
                          <button
                            onClick={() => {
                              setSelectedUser(userItem);
                              setShowDeleteModal(true);
                              setModalError("");
                            }}
                            disabled={isUpdating}
                            className="text-red-600 hover:text-red-900 ml-4"
                          >
                            Remove Access
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;