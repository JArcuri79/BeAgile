import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useAuth } from '../contexts/AuthContext';

const AccountSettings = () => {
  const { role } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState(null);

  const handleAuth = (e) => {
    e.preventDefault();
    if (authPassword === 'password') {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password. (Hint: use "password" for mock access)');
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    
    // Strict Regex Requirements: 12 chars, upper, lower, 2 numbers, 2 special chars
    const strictRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=(.*[0-9]){2})(?=(.*[£$%#@><?!]){2}).{12,}$/;

    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (!strictRegex.test(passwords.new)) {
      setMessage({ type: 'error', text: 'Password must be 12+ chars, include upper/lower case, 2 numbers, and 2 special characters (£,$,%,#,@,>,<,?,!).' });
      return;
    }

    setMessage({ type: 'success', text: 'Password successfully updated!' });
    setPasswords({ current: '', new: '', confirm: '' });
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-[calc(100vh-124px)] flex items-center justify-center bg-[var(--bg-main)] p-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-10 rounded-[2rem] shadow-2xl max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center text-3xl mb-6 mx-auto">
            <SafeIcon icon={FiIcons.FiLock} />
          </div>
          <h2 className="text-2xl font-black text-center mb-2 text-[var(--text-main)]">Security Check</h2>
          <p className="text-[var(--text-muted)] text-sm font-bold text-center mb-8">Please enter your current password to access account settings.</p>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <input 
              type="password" 
              value={authPassword} 
              onChange={e => setAuthPassword(e.target.value)} 
              placeholder="Enter password..." 
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)] text-center tracking-widest"
            />
            <button type="submit" className="w-full py-4 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-black text-sm shadow-xl hover:scale-[1.02] transition-all">
              AUTHENTICATE
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-10 space-y-10 bg-[var(--bg-main)] min-h-screen">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter uppercase text-[var(--text-main)]">Account Settings</h1>
        <p className="text-[var(--text-muted)] font-bold">Manage your identity and security credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-10 shadow-xl space-y-8 h-fit">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
              <SafeIcon icon={FiIcons.FiUser} className="text-2xl" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-[var(--text-main)]">Profile Information</h2>
          </div>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Display Name</label>
              <div className="px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-main)]">
                Logged in as {role.replace('_', ' ').toUpperCase()}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Email Address</label>
              <div className="px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-main)]">
                {role}@company.com
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-10 shadow-xl space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
              <SafeIcon icon={FiIcons.FiShield} className="text-2xl" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-[var(--text-main)]">Update Password</h2>
          </div>
          
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Current Password</label>
              <input type="password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)]" />
            </div>
            <div className="pt-4 border-t border-[var(--border-color)]">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">New Password</label>
              <input type="password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)]" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-2">Confirm New Password</label>
              <input type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)] text-[var(--text-main)]" />
            </div>

            {message && (
              <div className={`p-4 rounded-xl text-xs font-bold ${message.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                {message.text}
              </div>
            )}

            <button type="submit" className="w-full py-4 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-black text-sm shadow-xl hover:scale-[1.02] transition-all">
              UPDATE CREDENTIALS
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;