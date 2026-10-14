import React, { useState } from 'react';
import { Search, User, X, Mail, Camera, Shield, Save, LogOut, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector }

from '../hooks/reduxHooks';

import {

 

 updateUser,
 logout

}

from '../app/features/auth/authSlice';

const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

const user = useAppSelector(

 state => state.auth.user

);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

 const handleSave = () => {

 dispatch(

  updateUser(editForm)

 );

 setIsEditing(false);

};

 const handleLogout = () => {
   dispatch(logout());
   navigate('/login');
 };

  return (
    <>
      <nav className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-white/5 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center w-96 relative">
          <Search className="absolute left-3 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search for users, operations, logs..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-cyan/50 transition-all font-medium placeholder:text-white/20"
          />
        </div>

        <div className="flex items-center gap-6">
          <div 
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white group-hover:text-brand-cyan transition-colors uppercase tracking-wider">{user?.name || 'Super Admin'}</p>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{user?.role || 'SUPER_ADMIN_PRV'}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-cyan to-brand-pink flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border border-white/10">
              <User className="text-white w-5 h-5" />
            </div>
          </div>
        </div>
      </nav>

      {/* Floating Profile Card */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end p-8 animate-in fade-in duration-300">
          <div className="fixed inset-0 bg-black/20" onClick={() => setIsProfileOpen(false)} />
          <div className="w-80 h-fit max-h-[calc(100vh-120px)] bg-[#1A1A2E] border border-white/10 relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[32px] animate-in zoom-in-95 slide-in-from-top-4 duration-300 overflow-y-auto no-scrollbar">
            <div className="h-24 bg-gradient-to-r from-brand-cyan/20 to-brand-pink/20 relative">
              <button 
                onClick={() => setIsProfileOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="px-5 pb-8">
              <div className="relative -mt-10 mb-5 flex justify-center">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-[28px] bg-gradient-to-tr from-brand-cyan to-brand-pink p-0.5 shadow-2xl">
                    <div className="w-full h-full rounded-[26px] bg-[#1A1A2E] flex items-center justify-center border border-white/5 overflow-hidden">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 p-1.5 rounded-lg bg-brand-cyan text-dark-bg shadow-lg hover:scale-110 transition-transform">
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-lg font-bold text-white tracking-tight">Admin Profile</h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded-full border border-brand-cyan/20">
                    <Shield className="w-2.5 h-2.5" />
                    {user?.role || 'Super Admin'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-white/20 ml-1">Name</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-white text-[11px] focus:outline-none focus:ring-1 focus:ring-brand-cyan/50 disabled:opacity-70 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-white/20 ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
                    <input
                      type="email"
                      disabled={!isEditing}
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-white text-[11px] focus:outline-none focus:ring-1 focus:ring-brand-cyan/50 disabled:opacity-70 transition-all font-medium"
                    />
                  </div>
                </div>

              </div>

              <div className="mt-8 flex flex-col gap-2">
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-[10px] hover:bg-white/10 transition-all uppercase tracking-widest"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={handleSave}
                      className="w-full py-2.5 rounded-xl bg-brand-cyan text-dark-bg font-bold text-[10px] shadow-xl shadow-brand-cyan/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="w-full py-2.5 rounded-xl border border-white/5 text-white/40 font-bold text-[10px] hover:text-white transition-all uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsLogoutConfirmOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-[10px] hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  <LogOut className="w-3 h-3" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#16181D] border border-white/10 overflow-hidden shadow-2xl">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Confirm Logout</h2>
                <p className="text-white/40 text-sm">Are you sure you want to logout?</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-5">
              <button
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="px-5 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition"
              >
                No
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
