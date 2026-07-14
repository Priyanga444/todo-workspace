import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  RiUser3Line, RiLockPasswordLine, RiProfileLine, 
  RiShieldUserLine, RiUserSettingsLine, RiContactsLine 
} from 'react-icons/ri';

const Profile = () => {
  const { user, setUser } = useApp();
  const [activeSubTab, setActiveSubTab] = useState('profile'); // profile, password
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { register: registerProfile, handleSubmit: handleSubmitProfile } = useForm({
    defaultValues: {
      name: user?.name,
      bio: user?.bio || '',
      role: user?.role || '',
      skills: user?.skills || '',
      phone: user?.phone || '',
      workspace_mode: user?.workspace_mode || 'team'
    }
  });

  const { register: registerPassword, handleSubmit: handleSubmitPassword, reset: resetPassword } = useForm();

  const onUpdateProfile = async (data) => {
    setProfileLoading(true);
    setMessage('');
    try {
      const updated = await api.updateProfile(data);
      setUser(updated);
      setMessage('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      setMessage('Failed to update profile: ' + err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const onUpdatePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    setPasswordLoading(true);
    setMessage('');
    try {
      await api.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      setMessage('Password updated successfully!');
      resetPassword();
    } catch (err) {
      console.error(err);
      setMessage('Failed to update password: ' + err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-purple-955 dark:text-purple-100 h-[calc(100vh-4rem)] flex flex-col min-h-0">
      
      {/* Profile Header Banner */}
      <div className="glass-panel p-6 bg-gradient-to-r from-pink-500/10 via-purple-500/5 to-transparent border border-pink-100 dark:border-pink-900/30 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden flex-shrink-0">
        {/* Floating gradient accent */}
        <div className="absolute right-[-10%] top-[-50%] w-72 h-72 rounded-full bg-pink-500/10 blur-[80px] pointer-events-none" />

        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 to-violet-500 flex items-center justify-center font-bold text-white text-3xl uppercase border-2 border-white shadow-lg flex-shrink-0">
          {user?.photo_url ? (
            <img src={user.photo_url} alt={user.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            user?.name?.charAt(0)
          )}
        </div>

        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-xl font-bold text-purple-950 dark:text-white">{user?.name}</h2>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="text-[10px] bg-pink-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-400 font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
              {user?.role || 'Lead Member'}
            </span>
            <span className="text-slate-400 text-xs">|</span>
            <span className="text-slate-500 dark:text-purple-300 text-xs">{user?.email}</span>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex-shrink-0 ${
          message.includes('successfully') 
            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
        }`}>
          {message}
        </div>
      )}

      {/* Main Settings Body */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 min-h-0">
        
        {/* Settings Navigation Menu (Left) */}
        <div className="glass-panel p-4 bg-white dark:bg-[#1c1535] border border-pink-100 dark:border-pink-900/40 flex flex-col gap-2 h-fit">
          <span className="text-[9px] uppercase font-extrabold text-pink-500 tracking-wider px-3 mb-2 block">Settings Console</span>
          <button
            onClick={() => { setActiveSubTab('profile'); setMessage(''); }}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeSubTab === 'profile'
                ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-md'
                : 'text-purple-900 dark:text-purple-200 hover:bg-pink-100/20'
            }`}
          >
            <RiUserSettingsLine className="text-base" />
            <span>Personal Profile</span>
          </button>
          <button
            onClick={() => { setActiveSubTab('password'); setMessage(''); }}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeSubTab === 'password'
                ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-md'
                : 'text-purple-900 dark:text-purple-200 hover:bg-pink-100/20'
            }`}
          >
            <RiLockPasswordLine className="text-base" />
            <span>Security & Password</span>
          </button>
        </div>

        {/* Content Pane (Right) */}
        <div className="md:col-span-3 glass-panel p-6 bg-white dark:bg-[#1c1535] border border-pink-100 dark:border-pink-900/40 overflow-y-auto min-h-0 flex flex-col">
          {activeSubTab === 'profile' ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6 pb-2 border-b border-pink-50 dark:border-purple-900/20">
                  <RiProfileLine className="text-pink-500 text-lg" />
                  <h3 className="font-bold text-sm">Capabilities & Bio</h3>
                </div>

                <form id="profile-settings-form" onSubmit={handleSubmitProfile(onUpdateProfile)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-purple-800 dark:text-purple-300 mb-1.5 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      {...registerProfile('name')}
                      className="w-full text-xs focus:outline-none focus:ring-0"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-purple-800 dark:text-purple-300 mb-1.5 uppercase tracking-wider">Job Role</label>
                    <input
                      type="text"
                      {...registerProfile('role')}
                      placeholder="e.g. Lead Designer"
                      className="w-full text-xs focus:outline-none focus:ring-0"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-purple-800 dark:text-purple-300 mb-1.5 uppercase tracking-wider">Skills (comma-separated)</label>
                    <input
                      type="text"
                      {...registerProfile('skills')}
                      placeholder="e.g. React, PostgreSQL"
                      className="w-full text-xs focus:outline-none focus:ring-0"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-purple-800 dark:text-purple-300 mb-1.5 uppercase tracking-wider">Phone Number</label>
                    <input
                      type="text"
                      {...registerProfile('phone')}
                      className="w-full text-xs focus:outline-none focus:ring-0"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-extrabold text-purple-800 dark:text-purple-300 mb-1.5 uppercase tracking-wider">Bio Description</label>
                    <textarea
                      {...registerProfile('bio')}
                      rows={3}
                      className="w-full text-xs focus:outline-none focus:ring-0 resize-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-extrabold text-purple-800 dark:text-purple-300 mb-1.5 uppercase tracking-wider">Workspace Mode Focus</label>
                    <select
                      {...registerProfile('workspace_mode')}
                      className="w-full text-xs focus:outline-none focus:ring-0"
                    >
                      <option className="bg-[#1c1535] text-white" value="team">Team Collaboration (Enable invite features & assignee indicators)</option>
                      <option className="bg-[#1c1535] text-white" value="single">Personal Workspace (Individual checklist focus, hide assignees)</option>
                    </select>
                  </div>
                </form>
              </div>

              <div className="flex justify-end pt-4 border-t border-pink-50 dark:border-purple-900/20 mt-6">
                <button
                  type="submit"
                  form="profile-settings-form"
                  disabled={profileLoading}
                  className="btn-primary text-xs font-semibold py-2 px-6"
                >
                  {profileLoading ? 'Saving Info...' : 'Save Capabilities'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6 pb-2 border-b border-pink-50 dark:border-purple-900/20">
                  <RiShieldUserLine className="text-pink-500 text-lg" />
                  <h3 className="font-bold text-sm">Security & Access</h3>
                </div>

                <form id="password-settings-form" onSubmit={handleSubmitPassword(onUpdatePassword)} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-[10px] font-extrabold text-purple-800 dark:text-purple-300 mb-1.5 uppercase tracking-wider">Current Password</label>
                    <input
                      type="password"
                      {...registerPassword('currentPassword', { required: true })}
                      className="w-full text-xs focus:outline-none focus:ring-0"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-purple-800 dark:text-purple-300 mb-1.5 uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      {...registerPassword('newPassword', { required: true })}
                      className="w-full text-xs focus:outline-none focus:ring-0"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-purple-800 dark:text-purple-300 mb-1.5 uppercase tracking-wider">Confirm New Password</label>
                    <input
                      type="password"
                      {...registerPassword('confirmPassword', { required: true })}
                      className="w-full text-xs focus:outline-none focus:ring-0"
                    />
                  </div>
                </form>
              </div>

              <div className="flex justify-end pt-4 border-t border-pink-50 dark:border-purple-900/20 mt-6">
                <button
                  type="submit"
                  form="password-settings-form"
                  disabled={passwordLoading}
                  className="btn-primary text-xs font-semibold py-2 px-6"
                >
                  {passwordLoading ? 'Updating credentials...' : 'Update Password'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Profile;
