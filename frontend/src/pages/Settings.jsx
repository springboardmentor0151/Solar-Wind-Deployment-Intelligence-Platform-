import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineArrowRightOnRectangle } from "react-icons/hi2";

import { useAuth } from "../Authentication/AuthContext";
import { logoutUser } from "../Authentication/authService";
import { updateDisplayName, changeUserPassword } from "../services/userService";
import { useToast } from "../context/ToastContext";

import DashboardLayout from "../components/layout/DashboardLayout";

export default function Settings() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const displayName = userData?.name || currentUser?.displayName || "";
  const email = userData?.email || currentUser?.email || "";
  const photoURL = userData?.photoURL || currentUser?.photoURL;

  const [name, setName] = useState(displayName);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast("Display name cannot be empty.", "error");
      return;
    }

    try {
      setSavingProfile(true);
      await updateDisplayName(currentUser, name.trim());
      showToast("Profile updated successfully.");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Failed to update profile.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Please fill in all password fields.", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("New password and confirmation don't match.", "error");
      return;
    }

    try {
      setChangingPassword(true);
      await changeUserPassword(currentUser, currentPassword, newPassword);
      showToast("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      const message =
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
          ? "Current password is incorrect."
          : error.message || "Failed to change password.";
      showToast(message, "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-6 lg:px-10 py-10">
        <h1 className="text-4xl font-bold text-slate-900">Settings</h1>
        <p className="mt-3 text-slate-600">Manage your account settings.</p>

        {/* Profile Card */}
        <div className="mt-10 bg-white rounded-3xl shadow-lg p-8">
          <div className="flex items-center gap-5 mb-8">
            {photoURL ? (
              <img
                src={photoURL}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-blue-500"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center text-3xl font-bold">
                {displayName.charAt(0).toUpperCase() || "U"}
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {displayName || "Unnamed User"}
              </h3>
              <p className="text-slate-500 break-all">{email}</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold mb-6">Account Information</h2>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <label className="font-medium text-slate-600">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-xl border p-3"
              />
            </div>

            <div>
              <label className="font-medium text-slate-600">Email</label>
              <input
                type="email"
                value={email}
                readOnly
                className="mt-2 w-full rounded-xl border p-3 bg-slate-50 text-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition disabled:opacity-60"
            >
              {savingProfile ? "Saving..." : "Update Profile"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="mt-8 bg-white rounded-3xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6">Change Password</h2>

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div>
              <label className="font-medium text-slate-600">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border p-3"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="font-medium text-slate-600">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-2 w-full rounded-xl border p-3"
                />
              </div>

              <div>
                <label className="font-medium text-slate-600">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2 w-full rounded-xl border p-3"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className="rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition disabled:opacity-60"
            >
              {changingPassword ? "Updating..." : "Change Password"}
            </button>
          </form>
        </div>

        {/* Logout */}
        <div className="mt-8 bg-white rounded-3xl shadow-lg p-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Log out of your account
            </h2>
            <p className="text-slate-500 mt-1">
              You'll need to sign in again to access your dashboard.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 px-6 py-3 font-medium transition"
          >
            <HiOutlineArrowRightOnRectangle />
            Logout
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
