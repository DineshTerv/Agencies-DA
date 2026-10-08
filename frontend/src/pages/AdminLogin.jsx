import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Admin.css';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Mock login for now since DB is down
      if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('adminToken', 'demo-token');
        navigate('/admin/dashboard');
        return;
      }
      
      const res = await axios.post('http://localhost:5000/api/admin/login', { username, password });
      if (res.data.message === 'Login successful') {
        localStorage.setItem('adminToken', 'demo-token'); // Simple demo auth
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-box glass">
        <h2>Admin Login</h2>
        {error && <p className="error-msg">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="login-btn">Login</button>
        </form>
        <p className="demo-hint">Demo Credentials: admin / admin123</p>
      </div>
    </div>
  );
};

export default AdminLogin;
