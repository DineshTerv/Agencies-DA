import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import './AuthPage.css';

const ROLES = [
  {
    key: 'user',
    label: 'Customer',
    icon: '🛍️',
    desc: 'Browse & order products',
    color: '#6c5ce7',
    gradient: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
  },
  {
    key: 'worker',
    label: 'Worker',
    icon: '🏭',
    desc: 'Manage deliveries & tasks',
    color: '#00b894',
    gradient: 'linear-gradient(135deg, #00b894, #55efc4)',
  },
  {
    key: 'admin',
    label: 'Admin',
    icon: '🛡️',
    desc: 'Full control & analytics',
    color: '#e17055',
    gradient: 'linear-gradient(135deg, #e17055, #fdcb6e)',
  },
];

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('user');
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const roleInfo = ROLES.find(r => r.key === selectedRole) || ROLES[0];

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'register' && form.password !== form.confirm) {
      return setError('Passwords do not match.');
    }
    if (mode === 'register' && form.password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        // Save to localStorage DB
        const users = JSON.parse(localStorage.getItem('da_users') || '[]');
        users.push({
          username: form.username,
          email: form.email,
          password: form.password,
          name: form.username,
          phone: '',
          address: '',
          avatar: 'man'
        });
        localStorage.setItem('da_users', JSON.stringify(users));

        try {
          // Attempt backend
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          await axios.post(`${API_URL}/auth/register`, {
            username: form.username,
            email: form.email,
            password: form.password,
            role: 'user', 
          });
        } catch (e) {
          console.log("Backend register failed, using local only.");
        }

        setSuccess('Customer account created successfully! Please sign in.');
        setMode('login');
        setSelectedRole('user');
        setForm({ username: '', email: '', password: '', confirm: '' });
      } else {
        // LOGIN MODE
        // Clear all previous tokens first to avoid cross-role mixups
        ['authToken', 'adminToken', 'workerToken', 'username', 'workerId', 'userRole'].forEach(key => localStorage.removeItem(key));

        let token = null;
        let role = selectedRole;
        let username = form.username;

        // 1. Client-side / Demo Authentication handling
        // Automatically determine role based on credentials if they use a reserved ID, or enforce based on selected tab.
        
        const isWorkerId = form.username.toLowerCase() === 'worker' || form.username.toUpperCase().startsWith('W');
        
        if (form.username.toLowerCase() === 'admin') {
          if (form.password === 'admin123') {
            token = 'demo-admin-token';
            role = 'admin';
            username = 'admin';
          } else {
            throw new Error('Invalid Admin credentials. Use admin / admin123');
          }
        } else if (isWorkerId) {
          if (form.password === 'worker123') {
            token = 'demo-worker-token';
            role = 'worker';
            username = form.username.toUpperCase();
          } else {
            throw new Error('Invalid Worker credentials. Use Worker ID (e.g., W101) / worker123');
          }
        } else {
          // If they selected worker tab but didn't enter a W- ID
          if (selectedRole === 'worker') {
             throw new Error('Invalid Worker ID. Must start with "W" (e.g., W101).');
          }
          // Customer login
          if (form.username && form.password) {
            const users = JSON.parse(localStorage.getItem('da_users') || '[]');
            // Support logging in via username or email
            const validUser = users.find(u => 
              (u.username === form.username || u.email === form.username) && 
              u.password === form.password
            );

            if (validUser) {
              token = 'demo-user-token';
              role = 'user';
              username = validUser.username;
            } else {
              throw new Error('Account not found or password incorrect. Please Create an Account first if you are a new customer.');
            }
          } else {
            throw new Error('Please enter a valid username and password.');
          }
        }

        // Set role-specific tokens & redirect to the correct portal
        if (role === 'worker') {
          localStorage.setItem('workerToken', token);
          localStorage.setItem('workerId', username);
          localStorage.setItem('userRole', 'worker');
          navigate('/worker/dashboard');
        } else if (role === 'admin') {
          localStorage.setItem('adminToken', token);
          localStorage.setItem('username', username);
          localStorage.setItem('userRole', 'admin');
          navigate('/admin/dashboard');
        } else {
          localStorage.setItem('authToken', token);
          localStorage.setItem('username', username);
          localStorage.setItem('userRole', 'user');
          navigate('/');
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        err.message || 
        'Invalid credentials. Please verify your username and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated background orbs */}
      <div className="auth-bg">
        <div 
          className="orb orb-1" 
          style={{ background: mode === 'register' ? 'linear-gradient(135deg, #ff9f43, #e67e22)' : roleInfo.gradient }} 
        />
        <div 
          className="orb orb-2" 
          style={{ background: mode === 'register' ? 'linear-gradient(135deg, #6c5ce7, #a29bfe)' : roleInfo.gradient }} 
        />
        <div className="orb orb-3" />
      </div>

      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-brand">
          <Link to="/" className="brand-logo-link" title="Return to Shop">
            <img src="/logo.jpg" alt="DA Logo" className="auth-logo" />
          </Link>
          <div>
            <h1 className="brand-name">DINESH AGENCIES</h1>
            <p className="brand-sub">
              {mode === 'register' ? 'Customer Account Registration' : 'Universal Portal Sign In'}
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="auth-toggle">
          <button
            className={`toggle-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`toggle-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); setSuccess(''); setSelectedRole('user'); }}
            type="button"
          >
            Create Account
          </button>
          <div className="toggle-slider" style={{ left: mode === 'login' ? '4px' : '50%' }} />
        </div>

        {/* ON ID CREATION / REGISTER: Show only Customer header */}
        {mode === 'register' && (
          <div className="customer-register-badge">
            <span className="cust-icon">🛍️</span>
            <div>
              <h4>New Customer Account</h4>
              <p>Create your ID to place orders & track deliveries</p>
            </div>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="auth-alert error">
            <span>⚠️</span> {error}
          </div>
        )}
        {success && (
          <div className="auth-alert success">
            <span>✅</span> {success}
          </div>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="field-group">
            <label htmlFor="auth-username">
              <span className="field-icon">👤</span> 
              {mode === 'register' 
                ? 'Username / Mobile' 
                : selectedRole === 'worker' 
                ? 'Worker ID (e.g., W101)' 
                : selectedRole === 'admin' 
                ? 'Admin Username' 
                : 'Username / Phone'}
            </label>
            <input
              id="auth-username"
              name="username"
              type="text"
              placeholder={
                mode === 'register' 
                  ? "Choose a username" 
                  : selectedRole === 'worker' 
                  ? "Enter Worker ID (e.g., W101)" 
                  : selectedRole === 'admin' 
                  ? "admin" 
                  : "Enter your username"
              }
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>

          {mode === 'register' && (
            <div className="field-group">
              <label htmlFor="auth-email">
                <span className="field-icon">📧</span> Email Address
              </label>
              <input
                id="auth-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
          )}

          <div className="field-group" style={{ position: 'relative' }}>
            <label htmlFor="auth-password">
              <span className="field-icon">🔑</span> Password
            </label>
            <input
              id="auth-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={
                mode === 'register' 
                  ? 'Min. 6 characters' 
                  : selectedRole === 'worker' 
                  ? 'worker123' 
                  : selectedRole === 'admin' 
                  ? 'admin123' 
                  : 'Enter password'
              }
              value={form.password}
              onChange={handleChange}
              required
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '12px', top: '38px', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {mode === 'register' && (
            <div className="field-group" style={{ position: 'relative' }}>
              <label htmlFor="auth-confirm">
                <span className="field-icon">🔒</span> Confirm Password
              </label>
              <input
                id="auth-confirm"
                name="confirm"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={handleChange}
                required
                autoComplete="new-password"
                style={{ paddingRight: '40px' }}
              />
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
            style={{ 
              background: mode === 'register' 
                ? 'linear-gradient(135deg, #ff9f43, #e67e22)' 
                : roleInfo.gradient 
            }}
          >
            {loading ? (
              <span className="spinner" />
            ) : mode === 'login' ? (
              `Sign In to ${roleInfo.label} Portal ${roleInfo.icon}`
            ) : (
              'Create Customer Account 🛍️'
            )}
          </button>
        </form>

        {/* Demo Hint Helper for Easy Testing */}
        {mode === 'login' && (
          <p className="demo-credentials-hint">
            💡 Admin: admin / admin123 | Worker: W101 / worker123
          </p>
        )}

        {/* Footer note */}
        <p className="auth-footer-note">
          {mode === 'login' ? (
            <>New customer?{' '}
              <button type="button" className="text-link" onClick={() => { setMode('register'); setSelectedRole('user'); }}>
                Create customer ID
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button type="button" className="text-link" onClick={() => setMode('login')}>
                Sign in
              </button>
            </>
          )}
        </p>

      </div>
    </div>
  );
}
