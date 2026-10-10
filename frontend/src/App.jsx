import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { ShoppingCart, X, Phone, User, Shield, Briefcase, Store, LogIn, ExternalLink, ChevronDown, Package, Heart } from 'lucide-react';
import './App.css';

import Home from './pages/Home';
import Cart from './pages/Cart';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/AdminDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import ProfileModal from './components/ProfileModal';

function AppContent() {
  const [cartItems, setCartItems] = useState([]);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  const savedUsername = localStorage.getItem('username') || localStorage.getItem('workerId');

  React.useEffect(() => {
    const path = location.pathname;
    if (path === '/login') document.title = 'DA - Sign In & Portals';
    else if (path.includes('/admin')) document.title = 'DA - ADMIN PAGE';
    else if (path.includes('/worker')) document.title = 'DA - WORKER PAGE';
    else if (path === '/cart') document.title = 'DA - CART';
    else document.title = 'DINESH AGENCIES - FMCG Wholesale';
  }, [location]);

  const addToCart = (product) => {
    const isLoggedIn = localStorage.getItem('authToken') || localStorage.getItem('adminToken') || localStorage.getItem('workerToken');
    if (!isLoggedIn) {
      alert("Please login or create an account to place orders.");
      window.location.href = '/login';
      return;
    }
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="app-container">
      {/* ── TOP HEADER WITH ALL PORTAL & PAGE LINKS ── */}
      {location.pathname !== '/login' && (
      <header className="glass main-header">
        <div className="container header-content">
          {/* Logo */}
          <div
            className="logo"
            onClick={() => setIsContactModalOpen(true)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', minWidth: '220px' }}
            title="Click to view Contact & Owners info"
          >
            <img src="/logo.jpg" alt="DA Logo" className="company-logo" />
            <div className="logo-text-block">
              <span className="logo-main">DINESH AGENCIES</span>
              <span className="logo-sub">FMCG Wholesale & Distribution</span>
            </div>
          </div>

          {/* Search Bar - Sabka Bazzar Style */}
          {!location.pathname.includes('/admin') && (
            <div className="sabka-search-bar" style={{
              flex: '1', 
              maxWidth: '600px', 
              margin: '0 2rem',
              position: 'relative'
            }}>
              <input 
                type="text" 
                placeholder="Search products, local names (e.g. tej patta, haldi, phone)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem 0.8rem 2.5rem',
                  borderRadius: '30px',
                  border: '1px solid #ddd',
                  backgroundColor: '#f8f9fa',
                  fontSize: '0.95rem',
                  paddingRight: '80px' /* Leave space for buttons */
                }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>🔍</span>
              <span 
                onClick={() => alert("Voice search is not fully implemented yet. Please type your search.")}
                style={{ position: 'absolute', right: '45px', top: '50%', transform: 'translateY(-50%)', color: '#ff9f43', cursor: 'pointer', fontSize: '1.2rem' }}
                title="Voice Search"
              >
                🎙️
              </span>
              <button 
                onClick={() => alert("Search clicked")}
                style={{ 
                  position: 'absolute', 
                  right: '4px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  backgroundColor: '#ff9f43', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: '35px', 
                  height: '35px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Search"
              >
                🔍
              </button>
            </div>
          )}

          {/* Navigation Links — Only visible on Admin Page */}
          <nav className="header-nav-links" style={{ gap: '1rem' }}>
            {(() => {
              const isWorker = localStorage.getItem('userRole') === 'worker';
              let displayName = savedUsername;
              let avatarEmoji = '👤';
              
              if (isWorker) {
                const workers = JSON.parse(localStorage.getItem('da_workers') || '[]');
                const worker = workers.find(w => w.id === savedUsername);
                if (worker) displayName = worker.name;
                avatarEmoji = '👨‍🔧';
              } else {
                const users = JSON.parse(localStorage.getItem('da_users') || '[]');
                const currentUser = users.find(u => u.username === savedUsername);
                avatarEmoji = currentUser?.avatar === 'girl' ? '👩' : (currentUser?.avatar === 'man' ? '👨' : '👤');
                if (currentUser && currentUser.name) displayName = currentUser.name;
              }

              // Format displayName to not show full email
              if (displayName && displayName.includes('@')) {
                displayName = displayName.split('@')[0];
                displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
              }

              if (location.pathname.includes('/admin')) {
                return (
                  <>
                    <Link to="/" className="nav-link-item"><Store size={17} /> Products</Link>
                    <Link to="/worker/dashboard" className="nav-link-item worker-nav"><Briefcase size={17} /> Worker Page</Link>
                    <Link to="/admin/dashboard" className="nav-link-item admin-nav active"><Shield size={17} /> Admin Page</Link>
                    {savedUsername ? (
                      <div className="nav-link-item user-nav" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setIsProfileModalOpen(true)}>
                        <span style={{ fontSize: '18px', marginRight: '5px' }}>{avatarEmoji}</span> Profile ({displayName})
                      </div>
                    ) : (
                      <Link to="/login" className="nav-link-item user-nav"><User size={17} /> User Page / Login</Link>
                    )}
                  </>
                );
              }
              
              return savedUsername ? (
                <div className="profile-dropdown-container">
                  <div 
                    className="nav-link-item user-nav" 
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  >
                    <span style={{ fontSize: '18px', marginRight: '5px' }}>{avatarEmoji}</span> {displayName} <ChevronDown size={14} style={{marginLeft: '4px', transform: isProfileMenuOpen ? 'rotate(180deg)' : 'none', transition: '0.2s'}} />
                  </div>
                  {isProfileMenuOpen && (
                    <div className="profile-dropdown-menu">
                      <div className="dropdown-item" onClick={() => { setIsProfileMenuOpen(false); setIsProfileModalOpen(true); }}>
                        <User size={16} /> My Profile
                      </div>
                      {localStorage.getItem('userRole') === 'admin' && (
                        <Link to="/admin/dashboard" className="dropdown-item" onClick={() => setIsProfileMenuOpen(false)}>
                          <Shield size={16} /> Admin Dashboard
                        </Link>
                      )}
                      {localStorage.getItem('userRole') === 'worker' && (
                        <Link to="/worker/dashboard" className="dropdown-item" onClick={() => setIsProfileMenuOpen(false)}>
                          <Briefcase size={16} /> Worker Dashboard
                        </Link>
                      )}
                      <Link to="/cart" className="dropdown-item" onClick={() => setIsProfileMenuOpen(false)}>
                        <Package size={16} /> Orders
                      </Link>
                      <div className="dropdown-item" onClick={() => {
                          setIsProfileMenuOpen(false);
                          ['authToken', 'adminToken', 'workerToken', 'username', 'workerId', 'userRole'].forEach(key => localStorage.removeItem(key));
                          window.location.href = '/login';
                      }}>
                        <LogIn size={16} /> Logout
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="profile-dropdown-container">
                  <div 
                    className="nav-link-item user-nav" 
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  >
                    <User size={17} style={{marginRight: '5px'}}/> Login <ChevronDown size={14} style={{marginLeft: '4px', transform: isProfileMenuOpen ? 'rotate(180deg)' : 'none', transition: '0.2s'}} />
                  </div>
                  {isProfileMenuOpen && (
                    <div className="profile-dropdown-menu">
                      <div className="dropdown-header">
                        <span>New customer?</span>
                        <Link to="/login" className="signup-link" onClick={() => setIsProfileMenuOpen(false)}>Sign Up</Link>
                      </div>
                      <Link to="/login" className="dropdown-item" onClick={() => setIsProfileMenuOpen(false)}>
                        <User size={16} /> My Profile
                      </Link>
                      <Link to="/login" className="dropdown-item" onClick={() => setIsProfileMenuOpen(false)}>
                        <Package size={16} /> Orders
                      </Link>
                      <Link to="/login" className="dropdown-item" onClick={() => setIsProfileMenuOpen(false)}>
                        <Heart size={16} /> Wishlist
                      </Link>
                    </div>
                  )}
                </div>
              );
            })()}
          </nav>

          {/* Cart Icon */}
          <div className="nav-actions">
            <Link to="/cart">
              <div className="cart-icon-wrapper" title="View Cart">
                <ShoppingCart size={24} />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </div>
            </Link>
          </div>
        </div>
      </header>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="main-body">
        <Routes>
          <Route path="/" element={
            <Home addToCart={addToCart} searchQuery={searchQuery} cartItems={cartItems} setCartItems={setCartItems} />
          } />
          <Route path="/cart" element={
            localStorage.getItem('authToken') || localStorage.getItem('adminToken') || localStorage.getItem('workerToken')
              ? <Cart cartItems={cartItems} setCartItems={setCartItems} />
              : <Navigate to="/login" replace />
          } />

          {/* User / Customer Login & ID Creation */}
          <Route path="/login" element={<AuthPage />} />

          {/* Direct portal redirects */}
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route path="/worker/login" element={<Navigate to="/login" replace />} />

          {/* Portals */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/worker/dashboard" element={<WorkerDashboard />} />
        </Routes>
      </main>

      {/* ── FOOTER NAVIGATION BAR ── */}
      {location.pathname !== '/login' && (
      <footer className="main-footer glass">
        <div className="container footer-content" style={{ flexDirection: 'column', textAlign: 'center', justifyContent: 'center' }}>
          <div className="footer-brand" style={{ textAlign: 'center', width: '100%' }}>
            <p>© 1999 <strong>Dinesh Agencies</strong>. All rights reserved.</p>
            <p className="footer-contact" onClick={() => setIsContactModalOpen(true)} style={{cursor: 'pointer', textAlign: 'center'}}>
              📞 Senior Owner: Mr. Nallathambi (944369507) | Manager: Dinesh (9566714372)
            </p>
          </div>

          {location.pathname.includes('/admin') && (
            <div className="footer-portal-links" style={{ justifyContent: 'center', marginTop: '1rem' }}>
              <span style={{fontWeight: 'bold', color: '#555'}}>Direct Links:</span>
              <Link to="/" className="footer-pill" style={{background: 'rgba(255, 159, 67, 0.15)', color: '#e67e22'}}>🏪 Products</Link>
              <Link to="/login" className="footer-pill user-pill">🛍️ User / Customer Page</Link>
              <Link to="/worker/dashboard" className="footer-pill worker-pill">🏭 Worker Page</Link>
              <Link to="/admin/dashboard" className="footer-pill admin-pill">🛡️ Admin Page</Link>
            </div>
          )}
        </div>
      </footer>
      )}

      {/* Contact Team Modal */}
      {isContactModalOpen && (
        <div className="contact-modal-overlay" onClick={() => setIsContactModalOpen(false)}>
          <div className="contact-modal-content glass" onClick={e => e.stopPropagation()}>
            <div className="contact-modal-header">
              <h2>Our Team & Contact Info</h2>
              <button className="close-btn" onClick={() => setIsContactModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="owners-container">
              <div className="owner-card">
                <div className="owner-image">
                  <img
                    src="https://images.unsplash.com/photo-1556157382-97eda2d62296?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"
                    alt="Nallathambi"
                  />
                </div>
                <h3>Mr. Nallathambi</h3>
                <p className="owner-title">Founder / Senior Owner</p>
                <a href="tel:944369507" className="phone-link"><Phone size={16} /> 944369507</a>
              </div>

              <div className="owner-card">
                <div className="owner-image">
                  <img
                    src="https://images.unsplash.com/photo-1600486913747-55e5470d6f40?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80"
                    alt="Dinesh"
                  />
                </div>
                <h3>Dinesh</h3>
                <p className="owner-title">Co-Owner / Manager</p>
                <a href="tel:9566714372" className="phone-link"><Phone size={16} /> 9566714372</a>
              </div>
            </div>
          </div>
        </div>
      )}

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        username={savedUsername} 
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
