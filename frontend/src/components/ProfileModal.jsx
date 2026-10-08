import React, { useState, useEffect } from 'react';

export default function ProfileModal({ isOpen, onClose, username }) {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', address: '', avatar: 'man' });

  useEffect(() => {
    if (isOpen && username) {
      const users = JSON.parse(localStorage.getItem('da_users') || '[]');
      const user = users.find(u => u.username === username);
      if (user) {
        setProfile(user);
      } else {
        setProfile({ username, name: username, email: '', phone: '', address: '', avatar: 'man' });
      }
    }
  }, [isOpen, username]);

  if (!isOpen) return null;

  const handleSave = () => {
    let users = JSON.parse(localStorage.getItem('da_users') || '[]');
    const index = users.findIndex(u => u.username === username);
    if (index >= 0) {
      users[index] = { ...users[index], ...profile };
    } else {
      users.push({ ...profile, username });
    }
    localStorage.setItem('da_users', JSON.stringify(users));
    alert('Profile updated successfully!');
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', color: '#333', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <h2 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>My Profile Settings</h2>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', marginTop: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input type="radio" name="avatar" checked={profile.avatar === 'man'} onChange={() => setProfile({...profile, avatar: 'man'})} /> 
            <span style={{ fontSize: '24px' }}>👨</span> Man Avatar
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input type="radio" name="avatar" checked={profile.avatar === 'girl'} onChange={() => setProfile({...profile, avatar: 'girl'})} /> 
            <span style={{ fontSize: '24px' }}>👩</span> Girl Avatar
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Full Name</label>
          <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Email</label>
          <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Phone Number</label>
          <input type="tel" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Delivery Address</label>
          <textarea value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', minHeight: '60px' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => {
            ['authToken', 'adminToken', 'workerToken', 'username', 'workerId', 'userRole'].forEach(key => localStorage.removeItem(key));
            window.location.href = '/login';
          }} style={{ padding: '10px 15px', background: '#ffeaa7', color: '#d63031', border: '1px solid #d63031', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Logout
          </button>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={onClose} style={{ padding: '10px 20px', background: '#f1f2f6', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
            <button onClick={handleSave} style={{ padding: '10px 20px', background: '#6c5ce7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Save Profile</button>
          </div>
        </div>
      </div>
    </div>
  );
}
