import React, { useEffect } from "react";
import { Clock, Mail, Shield, User } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../hooks/reduxHooks";
import { useGetProfileQuery } from "../app/features/auth/authApi";
import { updateUser } from "../app/features/auth/authSlice";
import { getErrorMessage } from "../lib/errors";

const formatDateTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("en-IN") : "N/A");

/**
 * Admin profile from GET /admin/profile (read-only: the backend has no profile-update endpoint;
 * password changes go through "Forgot password" on the login screen).
 */
const Settings: React.FC = () => {
  const dispatch = useAppDispatch();
  const stored = useAppSelector((state) => state.auth.user);
  const { data, error, isLoading } = useGetProfileQuery();
  const profile = data?.data?.admin;

  // Keep the navbar's cached admin (from login) in sync with the server profile.
  useEffect(() => {
    if (profile) dispatch(updateUser({ ...profile }));
  }, [profile, dispatch]);

  const admin = profile ?? stored;
  const adminName = admin?.name ?? admin?.fullName ?? "Admin";
  const adminEmail = admin?.email ?? "N/A";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-white/40 mt-1">View administrator account details.</p>
      </div>

      {error ? (
        <div className="glass-card p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-200 text-sm max-w-3xl">
          Failed to load profile: {getErrorMessage(error)}
        </div>
      ) : null}

      <div className="glass-card rounded-3xl border border-white/5 bg-white/[0.02] p-8 max-w-3xl">
        <div className="flex items-center gap-4 pb-6 border-b border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-cyan to-brand-pink flex items-center justify-center">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Admin Details</h2>
            <p className="text-white/40 text-sm mt-1">
              {isLoading ? "Loading..." : "Your administrator account information"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex items-center gap-4">
            <User className="text-brand-cyan" />
            <div>
              <p className="text-white/40 text-sm">Name</p>
              <p className="text-white font-semibold mt-1">{adminName}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex items-center gap-4">
            <Mail className="text-brand-cyan" />
            <div className="min-w-0">
              <p className="text-white/40 text-sm">Email</p>
              <p className="text-white font-semibold mt-1 break-all">{adminEmail}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex items-center gap-4">
            <Shield className="text-brand-cyan" />
            <div>
              <p className="text-white/40 text-sm">Role</p>
              <p className="text-white font-semibold mt-1 capitalize">
                {admin?.role ?? "N/A"}
                {profile ? (profile.isActive === false ? " · inactive" : " · active") : ""}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex items-center gap-4">
            <Clock className="text-brand-cyan" />
            <div>
              <p className="text-white/40 text-sm">Last Login</p>
              <p className="text-white font-semibold mt-1">{formatDateTime(profile?.lastLoginAt)}</p>
            </div>
          </div>
        </div>

        <p className="text-white/30 text-xs mt-6">
          Profile editing is not available from the server yet. To change your password, use
          “Forgot password” on the login screen.
        </p>
      </div>
    </div>
  );
};

export default Settings;
