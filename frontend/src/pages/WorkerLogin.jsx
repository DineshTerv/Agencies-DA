import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css'; // Reusing admin styles for consistent UI

const WorkerLogin = () => {
  const [workerId, setWorkerId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Mock login for now
    if (workerId.startsWith('W') && password) {
      localStorage.setItem('workerToken', 'demo-worker');
      localStorage.setItem('workerId', workerId);
      navigate('/worker/dashboard');
    } else {
      setError('Invalid Worker ID or Password. ID must start with "W"');
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-box glass" style={{ borderTop: '4px solid var(--secondary-color)' }}>
        <h2 style={{ color: 'var(--secondary-color)' }}>Worker Portal Login</h2>
        {error && <p className="error-msg">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Worker ID (e.g., W101)</label>
            <input 
              type="text" 
              value={workerId} 
              onChange={(e) => setWorkerId(e.target.value.toUpperCase())} 
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
          <button type="submit" className="login-btn" style={{ background: 'var(--secondary-color)', color: '#000' }}>Access Portal</button>
        </form>
      </div>
    </div>
  );
};

export default WorkerLogin;
