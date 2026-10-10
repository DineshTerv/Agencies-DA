import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AVATARS = [
  { id: 'man', label: 'Man', emoji: '👨' },
  { id: 'girl', label: 'Girl', emoji: '👩' },
  { id: 'boy', label: 'Boy', emoji: '👦' },
  { id: 'woman', label: 'Woman', emoji: '👱‍♀️' },
  { id: 'ninja', label: 'Ninja', emoji: '🥷' },
  { id: 'superhero', label: 'Hero', emoji: '🦸' },
  { id: 'astronaut', label: 'Astronaut', emoji: '🧑‍🚀' }
];

export default function ProfileModal({ isOpen, onClose, username }) {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', address: '', avatar: 'man' });
  const [avatarIndex, setAvatarIndex] = useState(0);

  useEffect(() => {
    if (isOpen && username) {
      const users = JSON.parse(localStorage.getItem('da_users') || '[]');
      const user = users.find(u => u.username === username);
      if (user) {
        setProfile(user);
        const idx = AVATARS.findIndex(a => a.id === user.avatar);
        if (idx >= 0) setAvatarIndex(idx);
      } else {
        setProfile({ username, name: username, email: '', phone: '', address: '', avatar: 'man' });
        setAvatarIndex(0);
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
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem', marginTop: '1rem' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#555', marginBottom: '10px' }}>Choose Your Avatar</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button 
              onClick={() => {
                const newIndex = avatarIndex === 0 ? AVATARS.length - 1 : avatarIndex - 1;
                setAvatarIndex(newIndex);
                setProfile({...profile, avatar: AVATARS[newIndex].id});
              }} 
              style={{ background: '#f1f2f6', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              <ChevronLeft size={20} />
            </button>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80px', animation: 'fadeIn 0.3s' }}>
              <span style={{ fontSize: '55px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))', lineHeight: '1' }}>
                {AVATARS[avatarIndex].emoji}
              </span>
              <span style={{ fontSize: '13px', color: '#666', marginTop: '8px', fontWeight: 'bold' }}>
                {AVATARS[avatarIndex].label}
              </span>
            </div>

            <button 
              onClick={() => {
                const newIndex = avatarIndex === AVATARS.length - 1 ? 0 : avatarIndex + 1;
                setAvatarIndex(newIndex);
                setProfile({...profile, avatar: AVATARS[newIndex].id});
              }} 
              style={{ background: '#f1f2f6', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
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
