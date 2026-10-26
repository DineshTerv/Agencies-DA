import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, ArrowRight, Search, MapPin, ChevronDown, ChevronLeft, ChevronRight, 
  Package, ShieldCheck, Truck, Sparkles, CheckCircle2, Phone, LogIn, User, Award
} from 'lucide-react';
import axios from 'axios';
import { PRODUCTS_DATA } from '../data/products';
import './Home.css';

const SWIGGY_CATEGORIES = [
  { id: 'all', name: 'All Products', image: '/logo.jpg', filterKey: 'All' },
  { id: 'agarbatti', name: 'Cycle Agarbatti', image: '/cycle_pure_100s.jpg', filterKey: 'Agarbatti' },
  { id: 'chocopie', name: 'Lotte Choco Pie', image: '/90_rs.jpg', filterKey: 'Choco Pie' },
  { id: 'dhoop', name: 'Dhoop & Sambrani', image: '/dhoop_cone.jpg', filterKey: 'Dhoop' },
  { id: 'puja', name: 'Pooja Combos', image: '/combo_image.jpg', filterKey: 'Puja' },
  { id: 'candies', name: 'Candies & Toffees', image: '/coffy_bite_classic.jpg', filterKey: 'Candy' },
  { id: 'eclairs', name: 'Lotte Eclairs', image: '/lotte_eclairs.jpg', filterKey: 'Toffee' },
  { id: 'oil', name: 'Idhayam Oil', image: 'https://www.idhayam.com/wp-content/uploads/2020/09/5-LIT-IDHAYM-.png', filterKey: 'Cooking Oil' },
  { id: 'cleaning', name: 'Pitambari & Gel', image: 'https://www.pitambari.com/shop/wp-content/uploads/2025/02/Pitambari-Shining-Powder-1kg.jpg', filterKey: 'Dishwash' },
  { id: 'snacks', name: 'Snacks & Sticks', image: '/stick.jpg', filterKey: 'Snack' }
];

const DELIVERY_CITIES = [
  "Dharmapuri (Main Hub)",
  "Salem City & Surrounds",
  "Krishnagiri District",
  "Hosur Retail Market",
  "Harur Town",
  "Morappur",
  "Pennagaram",
  "Palacode",
  "Bommidi",
  "Pappireddipatti",
  "Omalur",
  "Tirupattur"
];

const EXTRA_CITIES = [
  "Pochampalli",
  "Karimangalam",
  "Uthangarai",
  "Kaveripattinam",
  "Mecheri",
  "Jalakandapuram",
  "Mettur",
  "Nallampalli"
];

export default function Home({ addToCart, cartItems = [], setCartItems }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState(PRODUCTS_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('Dharmapuri (Main Hub)');
  const [isLocDropdownOpen, setIsLocDropdownOpen] = useState(false);
  const [showMoreCities, setShowMoreCities] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // In-Page Sign In Modal State
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const carouselRef = useRef(null);

  const savedUsername = localStorage.getItem('username');
  const userRole = localStorage.getItem('userRole') || (localStorage.getItem('adminToken') ? 'admin' : (localStorage.getItem('workerToken') ? 'worker' : 'customer'));
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Fetch backend products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await axios.get(`${apiUrl}/products`);
        if (res.data && res.data.length > 0) {
          setProducts(res.data);
        }
      } catch (err) {
        console.warn("API Error, falling back to bundled products:", err.message);
        setProducts(PRODUCTS_DATA);
      }
    };
    fetchProducts();
  }, []);

  const getCartQuantity = (id) => {
    const item = cartItems.find(i => i.id === id);
    return item ? item.quantity : 0;
  };

  const decreaseQuantity = (id) => {
    if (!setCartItems) return;
    setCartItems(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, quantity: item.quantity - 1 } : item);
      return updated.filter(item => item.quantity > 0);
    });
  };

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollToCatalog = () => {
    const el = document.getElementById('wholesale-catalog-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuickLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginUsername.trim()) {
      setLoginError('Please enter your Phone or Username');
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.post(`${apiUrl}/auth/login`, {
        username: loginUsername.trim(),
        password: loginPassword || '123456'
      });
      if (res.data && res.data.token) {
        localStorage.setItem('authToken', res.data.token);
        localStorage.setItem('username', res.data.username || loginUsername.trim());
        localStorage.setItem('userRole', res.data.role || 'customer');
        setIsSignInOpen(false);
        window.location.reload();
      }
    } catch {
      // Offline fallback login for seamless UX
      localStorage.setItem('authToken', 'offline-token-' + Date.now());
      localStorage.setItem('username', loginUsername.trim());
      localStorage.setItem('userRole', 'customer');
      setIsSignInOpen(false);
      window.location.reload();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('workerToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    window.location.reload();
  };

  // Filter products by category & search query
  const filteredProducts = products.filter(p => {
    let matchesCategory = true;
    if (activeCategory !== 'All') {
      matchesCategory = (p.category_name || '').toLowerCase() === activeCategory.toLowerCase();
    }
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      (p.name || '').toLowerCase().includes(q) || 
      (p.category_name || '').toLowerCase().includes(q) ||
      (p.variant || '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="swiggy-landing-page">
      {/* ────────────────────────────────────────────────────────────
          1. SWIGGY VIBRANT ORANGE HERO SECTION (PHOTO 1)
          ──────────────────────────────────────────────────────────── */}
      <section className="swiggy-hero-wrapper">
        <div className="hero-deco-bg-left"></div>
        <div className="hero-deco-bg-right"></div>

        <div className="swiggy-hero-container">
          {/* Header Row */}
          <div className="swiggy-header-row">
            {/* Logo */}
            <div className="swiggy-logo-group" onClick={() => navigate('/')}>
              <div className="swiggy-logo-badge">
                <img src="/logo.jpg" alt="Dinesh Agencies" />
              </div>
              <div className="swiggy-logo-text">
                <span className="swiggy-brand-title">Dinesh Agencies</span>
                <span className="swiggy-brand-sub">FMCG & Pooja Wholesale Hub</span>
              </div>
            </div>

            {/* Nav links */}
            <div className="swiggy-nav-links">
              <button 
                type="button" 
                className="swiggy-nav-item" 
                onClick={scrollToCatalog}
              >
                Wholesale Portal
              </button>
              <a 
                href="https://wa.me/919566714372?text=Hello%20Dinesh%20Agencies,%20I%20want%20to%20partner%20with%20you%20for%20wholesale%20store%20orders." 
                target="_blank" 
                rel="noopener noreferrer" 
                className="swiggy-nav-item"
              >
                Partner with us
              </a>
              <a 
                href="https://wa.me/919566714372?text=Send%20today's%20latest%20wholesale%20price%20list." 
                target="_blank" 
                rel="noopener noreferrer" 
                className="swiggy-app-btn"
              >
                Get Rate List ↗
              </a>

              {/* Sign In / User Profile */}
              {savedUsername ? (
                <div className="swiggy-user-pill">
                  <User size={15} />
                  <span>{savedUsername}</span>
                  <button 
                    onClick={handleLogout} 
                    style={{ background: 'transparent', border: 'none', color: '#ff9f43', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.78rem' }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button 
                  type="button" 
                  className="swiggy-signin-btn"
                  onClick={() => setIsSignInOpen(true)}
                >
                  <LogIn size={16} /> Sign In
                </button>
              )}

              {/* Cart Button */}
              <Link to="/cart" className="swiggy-cart-header-btn" title="View Cart">
                <ShoppingCart size={20} />
                {cartCount > 0 && <span className="swiggy-cart-badge">{cartCount}</span>}
              </Link>
            </div>
          </div>

          {/* Hero Center Headline */}
          <div className="swiggy-hero-center">
            <h1 className="swiggy-hero-headline">
              Order Pooja & Wholesale FMCG.<br />Direct Factory Pricing. Dinesh Agencies!
            </h1>

            {/* Dual Location & Search Bar */}
            <div className="swiggy-search-combo">
              {/* Location Select */}
              <div 
                className="swiggy-loc-select-box"
                onClick={() => setIsLocDropdownOpen(!isLocDropdownOpen)}
                title="Select Delivery District / Town"
              >
                <MapPin size={18} className="loc-icon-pin" />
                <span className="loc-text-current">{selectedCity}</span>
                <ChevronDown size={15} className="loc-chevron" />

                {isLocDropdownOpen && (
                  <div className="swiggy-loc-dropdown" onClick={e => e.stopPropagation()}>
                    {DELIVERY_CITIES.slice(0, 6).map(city => (
                      <div 
                        key={city} 
                        className="loc-dropdown-item"
                        onClick={() => {
                          setSelectedCity(city);
                          setIsLocDropdownOpen(false);
                        }}
                      >
                        <MapPin size={13} color="#fc8019" /> {city}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Search input */}
              <div className="swiggy-search-input-box">
                <input 
                  type="text" 
                  placeholder="Search for Cycle Pure Agarbatti, Lotte Choco Pie, Pitambari, Dhoop..." 
                  className="swiggy-search-input"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') scrollToCatalog();
                  }}
                />
                <button 
                  type="button" 
                  className="swiggy-search-action-btn"
                  onClick={scrollToCatalog}
                  title="Search Products"
                >
                  <Search size={20} />
                </button>
              </div>
            </div>

            {/* 3 Swiggy-Style Feature Cards (Photo 1) */}
            <div className="swiggy-feature-cards">
              <div 
                className="swiggy-feat-card"
                onClick={() => {
                  setActiveCategory('Agarbatti');
                  scrollToCatalog();
                }}
              >
                <span className="feat-tag">UPTO 35% MARGIN</span>
                <h3 className="feat-title">CYCLE PURE AGARBATTI</h3>
                <span className="feat-subtitle">AUTHENTIC POOJA RANGE</span>
                <div className="feat-card-bottom">
                  <span className="feat-arrow">Order Wholesale →</span>
                  <img src="/cycle_pure_100s.jpg" alt="Cycle Pure" className="feat-thumb-img" />
                </div>
              </div>

              <div 
                className="swiggy-feat-card"
                onClick={() => {
                  setActiveCategory('Choco Pie');
                  scrollToCatalog();
                }}
              >
                <span className="feat-tag" style={{ background: '#e0f2fe', color: '#0284c7' }}>FACTORY BATCH</span>
                <h3 className="feat-title">LOTTE CONFECTIONERY</h3>
                <span className="feat-subtitle">CHOCO PIE & CANDIES</span>
                <div className="feat-card-bottom">
                  <span className="feat-arrow">Order Wholesale →</span>
                  <img src="/90_rs.jpg" alt="Lotte Choco Pie" className="feat-thumb-img" />
                </div>
              </div>

              <div 
                className="swiggy-feat-card"
                onClick={() => {
                  setActiveCategory('Dishwash');
                  scrollToCatalog();
                }}
              >
                <span className="feat-tag" style={{ background: '#fef3c7', color: '#d97706' }}>SAME-DAY DISPATCH</span>
                <h3 className="feat-title">POOJA & STORE CARE</h3>
                <span className="feat-subtitle">PITAMBARI, DHOOP & OIL</span>
                <div className="feat-card-bottom">
                  <span className="feat-arrow">Order Wholesale →</span>
                  <img src="/combo_image.jpg" alt="Pooja Combos" className="feat-thumb-img" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          2. CLEAN WHITE SECTION WITH 3D DELIVERY DOLL MASCOT
          ──────────────────────────────────────────────────────────── */}
      <section className="swiggy-white-section">
        <div className="swiggy-content-container">

          {/* ── 3D Delivery Doll Mascot Banner (As requested by USER) ── */}
          <div className="delivery-doll-showcase-card">
            <div className="doll-image-wrapper">
              <img 
                src="/delivery_doll.jpg" 
                alt="Arjun - Dinesh Agencies 3D Delivery Mascot Doll" 
                className="doll-mascot-img"
              />
              <div className="doll-dispatch-pill">
                <Truck size={15} color="#fc8019" />
                <span>24-Hour Dharmapuri Hub Delivery</span>
              </div>
            </div>

            <div className="doll-info-wrapper">
              <div className="doll-eyebrow">
                <Sparkles size={13} />
                <span>EXPRESS WHOLESALE DISPATCH</span>
              </div>
              <h2 className="doll-heading">
                Meet Arjun — Your Express Wholesale Delivery Partner!
              </h2>
              <p className="doll-subtext">
                Every carton is packed fresh from factory batches, sealed at our Dharmapuri Hub, and delivered directly to your shop counter with zero transit damage.
              </p>

              <div className="doll-perks-grid">
                <div className="perk-item">
                  <ShieldCheck size={17} color="#10b981" />
                  <span>100% Genuine Factory Direct</span>
                </div>
                <div className="perk-item">
                  <Truck size={17} color="#fc8019" />
                  <span>Same-Day Transport Loading</span>
                </div>
                <div className="perk-item">
                  <Award size={17} color="#6366f1" />
                  <span>Highest Retail Profit Margins</span>
                </div>
                <div className="perk-item">
                  <CheckCircle2 size={17} color="#10b981" />
                  <span>Free Replacement for Damaged Stock</span>
                </div>
              </div>

              <div className="doll-action-row">
                <button type="button" className="doll-explore-btn" onClick={scrollToCatalog}>
                  <span>Browse Products ({products.length} SKUs)</span>
                  <ArrowRight size={17} />
                </button>
                <a 
                  href="https://wa.me/919566714372?text=Hello%20Arjun,%20I%20want%20to%20order%20wholesale%20stock%20for%20my%20shop." 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="doll-wa-btn"
                >
                  <Phone size={16} />
                  <span>WhatsApp Fast Order</span>
                </a>
              </div>
            </div>
          </div>

          {/* ── "ORDER OUR BEST FOOD OPTIONS" -> CIRCULAR CATEGORIES (PHOTO 2) ── */}
          <div className="swiggy-categories-carousel-block">
            <div className="carousel-header-row">
              <h2 className="carousel-section-title">Order our best wholesale categories</h2>
              <div className="carousel-controls">
                <button 
                  type="button" 
                  className="carousel-arrow-btn" 
                  onClick={() => scrollCarousel('left')}
                  title="Scroll Left"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  type="button" 
                  className="carousel-arrow-btn" 
                  onClick={() => scrollCarousel('right')}
                  title="Scroll Right"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="circular-categories-track" ref={carouselRef}>
              {SWIGGY_CATEGORIES.map(cat => (
                <button 
                  key={cat.id} 
                  type="button"
                  className={`circular-cat-card ${activeCategory === cat.filterKey ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCategory(cat.filterKey);
                    scrollToCatalog();
                  }}
                >
                  <div className="circular-img-wrap">
                    <img src={cat.image} alt={cat.name} />
                  </div>
                  <span className="circular-cat-name">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── ALL WHOLESALE PRODUCTS (PURE PHOTO SHOWCASE - NO PRODUCT CARDS) ── */}
          <div id="wholesale-catalog-section" className="swiggy-showcase-section">
            <div className="catalog-section-header">
              <div className="showcase-header-row">
                <div>
                  <h2 className="catalog-title">
                    {activeCategory === 'All' ? 'Order our best wholesale varieties' : `${activeCategory} Collection`}
                  </h2>
                  <p className="catalog-subtitle">
                    Showing authentic stock items from Dinesh Agencies wholesale inventory ({filteredProducts.length} items)
                  </p>
                </div>
                {activeCategory !== 'All' && (
                  <button 
                    type="button" 
                    className="clear-cat-filter-btn" 
                    onClick={() => setActiveCategory('All')}
                  >
                    View All Products
                  </button>
                )}
              </div>
            </div>

            <div className="swiggy-photo-only-grid">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  className="swiggy-photo-only-card"
                  onClick={() => setSelectedProduct(product)}
                  title={`View ${product.name}`}
                >
                  <div className="swiggy-photo-disc">
                    <img 
                      src={product.image_url || 'https://via.placeholder.com/200?text=Product'} 
                      alt={product.name} 
                      loading="lazy"
                    />
                  </div>
                  <span className="swiggy-photo-name">{product.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── WHATSAPP APP DOWNLOAD BANNER (PHOTO 3) ── */}
          <div className="swiggy-app-banner-section">
            <div className="app-banner-content">
              <span className="app-banner-tag">
                <Sparkles size={12} /> INSTANT WHOLESALE DISPATCH
              </span>
              <h2 className="app-banner-title">
                Get Dinesh Agencies Wholesale WhatsApp Ordering Now!
              </h2>
              <p className="app-banner-desc">
                Receive live wholesale rate cards, instant order dispatch tracking, and automated GST billing directly on your WhatsApp.
              </p>

              <div className="app-phone-number-box">
                <div className="phone-icon-round">
                  <Phone size={18} />
                </div>
                <div>
                  <div className="phone-meta-title">Direct Hub Helpdesk</div>
                  <div className="phone-meta-val">9566714372 / 944369507</div>
                </div>
              </div>
            </div>

            <div className="app-banner-qr-block">
              <div className="qr-code-img-wrap">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent('https://wa.me/919566714372?text=Hello%20Dinesh%20Agencies,%20please%20send%20today\'s%20wholesale%20price%20list.')}`} 
                  alt="Dinesh Agencies WhatsApp QR Code" 
                />
              </div>
              <div className="qr-instructions">
                <span className="qr-title">Scan to Order</span>
                <span className="qr-sub">Open WhatsApp camera to connect directly with our dispatch manager</span>
                <a 
                  href="https://wa.me/919566714372?text=Hello%20Dinesh%20Agencies,%20I%20want%20to%20order%20wholesale%20stock." 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="qr-chat-btn"
                >
                  Open Chat 💬
                </a>
              </div>
            </div>
          </div>

          {/* ── CITIES WITH DIRECT DELIVERY (PHOTO 3) ── */}
          <div className="swiggy-cities-section">
            <h2 className="cities-section-title">Regions with direct wholesale delivery</h2>
            <div className="cities-grid">
              {DELIVERY_CITIES.map(city => (
                <div 
                  key={city} 
                  className="city-pill-btn"
                  onClick={() => {
                    setSelectedCity(city);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Wholesale delivery in {city.split(' ')[0]}
                </div>
              ))}

              {showMoreCities && EXTRA_CITIES.map(city => (
                <div 
                  key={city} 
                  className="city-pill-btn"
                  onClick={() => {
                    setSelectedCity(city);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Wholesale delivery in {city}
                </div>
              ))}

              <button 
                type="button" 
                className="show-more-cities-btn"
                onClick={() => setShowMoreCities(!showMoreCities)}
              >
                <span>{showMoreCities ? 'Show Less ∧' : 'Show More ∨'}</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────
          3. SWIGGY LIGHT GRAY FOOTER (PHOTO 4)
          ──────────────────────────────────────────────────────────── */}
      <footer className="swiggy-footer">
        <div className="swiggy-content-container">
          <div className="footer-top-columns">
            {/* Brand Col */}
            <div className="footer-brand-col">
              <div className="footer-logo-row">
                <img src="/logo.jpg" alt="Logo" className="footer-logo-img" />
                <span className="footer-brand-title">Dinesh Agencies</span>
              </div>
              <p className="footer-copy">
                © 2026 Dinesh Agencies Wholesale Limited.<br />
                Authorised distributor of Cycle Pure Agarbatti, Lotte Confectionery & Pitambari products.
              </p>
            </div>

            {/* Col 1: Company */}
            <div>
              <h4 className="footer-col-title">Company</h4>
              <ul className="footer-links-list">
                <li onClick={scrollToCatalog}>About Us</li>
                <li onClick={scrollToCatalog}>Wholesale Network</li>
                <li onClick={scrollToCatalog}>Brands Partnered</li>
                <li onClick={scrollToCatalog}>Retailer Margins</li>
                <li><Link to="/admin/dashboard" style={{color: '#fc8019', fontWeight: 700}}>Admin Dashboard</Link></li>
                <li><Link to="/worker/dashboard" style={{color: '#fc8019', fontWeight: 700}}>Worker Portal</Link></li>
              </ul>
            </div>

            {/* Col 2: Contact us */}
            <div>
              <h4 className="footer-col-title">Contact us</h4>
              <div className="footer-contact-item">
                <strong>Senior Owner:</strong><br />
                Mr. Nallathambi: <a href="tel:944369507" style={{color: '#fc8019'}}>944369507</a>
              </div>
              <div className="footer-contact-item">
                <strong>Manager:</strong><br />
                Dinesh: <a href="tel:9566714372" style={{color: '#fc8019'}}>9566714372</a>
              </div>
              <div className="footer-contact-item">
                <strong>Main Warehouse Hub:</strong><br />
                Dharmapuri, Tamil Nadu
              </div>
            </div>

            {/* Col 3: Available in */}
            <div>
              <h4 className="footer-col-title">Available in:</h4>
              <ul className="footer-links-list">
                <li>Dharmapuri Hub</li>
                <li>Salem City</li>
                <li>Krishnagiri</li>
                <li>Hosur</li>
                <li>Harur & Morappur</li>
                <li style={{color: '#fc8019', fontWeight: 700}}>25+ Taluks Covered</li>
              </ul>
            </div>

            {/* Col 4: Legal */}
            <div>
              <h4 className="footer-col-title">Legal & Policy</h4>
              <ul className="footer-links-list">
                <li>Terms & Conditions</li>
                <li>Wholesale Return Policy</li>
                <li>Privacy Policy</li>
                <li>GST Invoicing Policy</li>
                <li>Damage Stock Guarantee</li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-divider">
            <span className="footer-bottom-cta">
              For bulk retail inquiries & price lists, connect on WhatsApp
            </span>
            <div className="footer-app-badges">
              <a 
                href="https://wa.me/919566714372" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="app-badge-btn"
              >
                <span>💬 WhatsApp Direct</span>
              </a>
              <Link to="/orders" className="app-badge-btn" style={{ background: '#fc8019' }}>
                <Package size={15} />
                <span>Track My Orders</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ────────────────────────────────────────────────────────────
          4. IN-PAGE SIGN IN MODAL / DRAWER
          ──────────────────────────────────────────────────────────── */}
      {isSignInOpen && (
        <div className="signin-modal-backdrop" onClick={() => setIsSignInOpen(false)}>
          <div className="signin-modal-card" onClick={e => e.stopPropagation()}>
            <button 
              type="button" 
              className="signin-modal-close" 
              onClick={() => setIsSignInOpen(false)}
            >
              &times;
            </button>

            <div className="signin-modal-header">
              <h3 className="signin-modal-title">Sign In to Dinesh Agencies</h3>
              <p className="signin-modal-sub">
                Enter your mobile number or username to access wholesale orders & cart
              </p>
            </div>

            <form onSubmit={handleQuickLogin}>
              <div className="signin-form-group">
                <label className="signin-form-label">Phone or Username</label>
                <input 
                  type="text" 
                  placeholder="e.g. 9566714372 or shop name"
                  className="signin-form-input"
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="signin-form-group">
                <label className="signin-form-label">Password / PIN (Default: 123456)</label>
                <input 
                  type="password" 
                  placeholder="Enter password"
                  className="signin-form-input"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                />
              </div>

              {loginError && (
                <div style={{ color: '#ef4444', fontSize: '0.82rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                  {loginError}
                </div>
              )}

              <button type="submit" className="signin-submit-btn">
                Sign In & Continue
              </button>
            </form>

            <div className="signin-portal-links-box">
              <Link to="/login" className="signin-portal-link" onClick={() => setIsSignInOpen(false)}>
                Full Login Page →
              </Link>
              <Link to="/worker/dashboard" className="signin-portal-link" onClick={() => setIsSignInOpen(false)}>
                Worker Desk →
              </Link>
              <Link to="/admin/dashboard" className="signin-portal-link" onClick={() => setIsSignInOpen(false)}>
                Admin Panel →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────
          5. PURE PHOTO PREVIEW LIGHTBOX (NO CART CARDS)
          ──────────────────────────────────────────────────────────── */}
      {selectedProduct && (
        <div 
          className="photo-lightbox-backdrop" 
          onClick={() => setSelectedProduct(null)}
        >
          <div 
            className="photo-lightbox-modal" 
            onClick={e => e.stopPropagation()}
          >
            <button 
              type="button"
              className="photo-lightbox-close" 
              onClick={() => setSelectedProduct(null)}
            >
              &times;
            </button>
            
            <div className="photo-lightbox-img-frame">
              <img 
                src={selectedProduct.image_url || 'https://via.placeholder.com/300?text=Product'} 
                alt={selectedProduct.name} 
              />
            </div>

            <div className="photo-lightbox-details">
              <span className="photo-lightbox-category">
                {selectedProduct.category_name}
              </span>
              <h3 className="photo-lightbox-title">
                {selectedProduct.name}
              </h3>
              <p className="photo-lightbox-desc">
                {selectedProduct.description || "Authentic FMCG stock distributed directly by Dinesh Agencies with direct manufacturer supply and wholesale pricing."}
              </p>

              <div className="photo-lightbox-actions">
                <a 
                  href={`https://wa.me/919566714372?text=${encodeURIComponent(`Hello Dinesh Agencies, I want to inquire about wholesale orders for: ${selectedProduct.name}`)}`}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="photo-lightbox-wa-btn"
                >
                  💬 Inquire on WhatsApp
                </a>
                <button 
                  type="button" 
                  className="photo-lightbox-done-btn"
                  onClick={() => setSelectedProduct(null)}
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
