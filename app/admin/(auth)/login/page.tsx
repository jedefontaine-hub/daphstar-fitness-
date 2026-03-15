"use client";

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingGithub, setLoadingGithub] = useState(false);

  const submitPassword = async () => {
    setMessage('');
    setLoadingPassword(true);
    try {
      const res = await signIn('credentials', { redirect: false, password });
      if (res?.error) {
        setMessage(res.error || 'Login failed');
      } else {
        window.location.href = '/admin/walkthrough';
      }
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : String(e));
    }
    setLoadingPassword(false);
  };

  const submitGithub = async () => {
    setMessage('');
    setLoadingGithub(true);
    try {
      await signIn('github', { callbackUrl: '/admin/walkthrough' });
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : String(e));
      setLoadingGithub(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 520, margin: '0 auto' }}>
      <h2>Admin Login</h2>
      <p>Sign in with password or GitHub to access admin tools.</p>

      <div style={{ marginTop: 12, marginBottom: 16 }}>
        <button onClick={submitGithub} disabled={loadingGithub} style={{ padding: '8px 12px' }}>
          {loadingGithub ? 'Redirecting...' : 'Sign in with GitHub'}
        </button>
      </div>

      <div style={{ margin: '14px 0', color: '#666' }}>or</div>

      <div style={{ marginBottom: 8 }}>
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '8px', display: 'block', marginTop: 6 }}
        />
      </div>
      <div>
        <button onClick={submitPassword} disabled={loadingPassword} style={{ padding: '8px 12px' }}>
          {loadingPassword ? 'Signing in...' : 'Sign in with Password'}
        </button>
        <span style={{ marginLeft: 12, color: 'red' }}>{message}</span>
      </div>

      <p style={{ marginTop: 16, fontSize: 13, color: '#666' }}>
        To restrict GitHub access, set `ADMIN_GITHUB_USERS` as a comma-separated list of GitHub usernames or emails.
      </p>
    </div>
  );
}
