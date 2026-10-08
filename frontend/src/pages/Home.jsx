import React, { useState, useEffect } from 'react';
import { ShoppingCart, ArrowRight, Mic } from 'lucide-react';
import axios from 'axios';
import { PRODUCTS_DATA } from '../data/products';
import './Home.css'; // Make sure we have a dedicated CSS file

const CATEGORY_TABS = [
  { name: 'All Categories', icon: '🗂️' },
  { name: 'Food Items', icon: '🌾' },
  { name: 'Pooja Items', icon: '🪔' },
  { name: 'Snacks & Sweets', icon: '🥨' }
];

const HIGHLIGHT_CARDS = [
  {
    title: 'Food & Grains',
    subtitle: 'Everyday essentials',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300'
  },
  {
    title: 'Pooja Items',
    subtitle: 'Divine & Pure',
    image: '/puja.jpg'
  },
  {
    title: 'Snacks & Beverages',
    subtitle: 'Refreshments wholesale',
    image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&q=80&w=300'
  }
];

const Home = ({ addToCart, searchQuery = '', cartItems = [], setCartItems }) => {
  const [products, setProducts] = useState(PRODUCTS_DATA);
  const [activeCategory, setActiveCategory] = useState('All Categories');
  const [selectedProduct, setSelectedProduct] = useState(null);

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
  
  useEffect(() => {
    const fetchProducts = async () => {
      // Prioritize local storage so admin edits are immediately visible globally
      const savedProducts = localStorage.getItem('da_products');
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
        return;
      }

      try {
        const res = await axios.get('http://localhost:5000/api/products');
        if(res.data && res.data.length > 0) {
          setProducts(res.data);
        }
      } catch (err) {
        console.log("Using mock data due to API error:", err.message);
        setProducts(PRODUCTS_DATA);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => {
    let matchesCategory = true;
    if (activeCategory !== 'All Categories') {
      const mapping = {
        'Food Items': ['Cooking Oil'],
        'Snacks & Sweets': ['Candy', 'Toffee', 'Lollipop', 'Choco Pie', 'Gum', 'Snack'],
        'Pooja Items': ['Agarbatti', 'Puja', 'Dhoop'],
        'Cleaning Supplies': ['Metal Cleaner', 'Silver Cleaner', 'Dishwash', 'Toilet Cleaner', 'Floor Cleaner', 'Drain Cleaner'],
        'Personal Care': ['Handwash'],
        'Household': [],
        'Beverages': []
      };
      const validCategories = mapping[activeCategory] || [];
      matchesCategory = validCategories.includes(p.category_name);
    }
    
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category_name.toLowerCase().includes(searchQuery.toLowerCase());
                          
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="home-container">
      {/* Category Navigation Bar */}
      <div className="category-nav-wrapper">
        <div className="container category-nav">
          {CATEGORY_TABS.map(cat => (
            <button 
              key={cat.name} 
              className={`cat-tab ${activeCategory === cat.name ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.name)}
            >
              <span className="cat-icon">{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="container">
        {/* Hero Section styled like Sabka Bazzar */}
        {activeCategory === 'All Categories' && (
          <section className="sabka-hero">
            <div className="hero-content-left">
              <h4 className="hero-subtitle">Quality You Can Trust</h4>
              <h1 className="hero-title">Your trusted partner<br/>for everyday needs</h1>
              <p className="hero-desc">"Bringing the best of Lotte, Cycle Pure, and more straight to your shelves. Premium wholesale delivered right to your door."</p>
              
              <div className="hero-actions">
                <button className="explore-btn" onClick={() => {
                  window.scrollTo({ top: document.querySelector('.products-grid').offsetTop, behavior: 'smooth' });
                }}>
                  Explore the collection <ArrowRight size={18} />
                </button>
              </div>

              <div className="hero-suggestions">
                <span className="suggest-label">Trending now:</span>
                <span className="suggest-pill">Choco Pie</span>
                <span className="suggest-pill">Cycle Agarbatti</span>
                <span className="suggest-pill">Pooja Combo</span>
              </div>
            </div>

            <div className="hero-marquee-container">
              <div style={{ textAlign: 'center', marginBottom: '15px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Our Premium Brands & Top Products
              </div>
              <div className="marquee-track">
                {(() => {
                  // Select a mix of interesting images
                  const marqueeImages = [
                    "/combo_image.jpg",
                    "/90_rs.jpg",
                    "/cycle_yagna.jpg",
                    "/stick.jpg",
                    "/coffy_bite_classic.jpg",
                    "https://m.media-amazon.com/images/I/71Hq5mPf17L._AC_UF350,350_QL80_.jpg", // Choco pie
                    "https://cycle.in/cdn/shop/files/Woods-1000x1000.jpg" // Woods
                  ];
                  // Duplicate the images to create a seamless infinite loop
                  const loopImages = [...marqueeImages, ...marqueeImages];
                  
                  return loopImages.map((img, idx) => (
                    <div key={idx} className="marquee-item">
                      <img src={img} alt="Product highlight" />
                    </div>
                  ));
                })()}
              </div>
            </div>
          </section>
        )}

        {/* Product Grid */}
        <section className="products-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="card">
              <div className="product-image-container" style={{ position: 'relative' }}>
                {product.discount_text && (
                  <span style={{ position: 'absolute', top: '10px', left: '10px', background: '#e17055', color: 'white', padding: '4px 8px', fontSize: '0.8rem', borderRadius: '4px', zIndex: 1, fontWeight: 'bold' }}>
                    {product.discount_text}
                  </span>
                )}
                <img 
                  src={product.image_url || 'https://via.placeholder.com/250x200?text=No+Image'} 
                  alt={product.name} 
                  onClick={() => setSelectedProduct(product)} 
                  style={{ cursor: 'pointer' }}
                />
              </div>
              <div className="product-info">
                <span className="product-category">{product.category_name}</span>
                <h3 className="product-title">{product.name}</h3>
                <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem'}}>{product.variant}</div>
                <div className="product-price">
                  ₹{product.price}
                  {product.original_price && (
                    <span style={{textDecoration: 'line-through', color: '#999', fontSize: '0.9rem', marginLeft: '8px', fontWeight: 'normal'}}>
                      ₹{product.original_price}
                    </span>
                  )}
                </div>
                {(() => {
                  const qty = getCartQuantity(product.id);
                  return qty > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', background: '#f8f9fa', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                      <button onClick={() => decreaseQuantity(product.id)} style={{ padding: '8px 15px', background: 'white', color: '#333', border: 'none', borderRight: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}>-</button>
                      <span style={{ fontWeight: 'bold', padding: '0 15px', color: '#333' }}>{qty}</span>
                      <button onClick={() => addToCart(product)} style={{ padding: '8px 15px', background: 'white', color: '#333', border: 'none', borderLeft: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}>+</button>
                    </div>
                  ) : Number(product.stock) === 0 ? (
                    <button className="out-of-stock-btn" disabled style={{ marginTop: '10px', width: '100%', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: '#e0e0e0', color: '#888', border: 'none', borderRadius: '8px', cursor: 'not-allowed', fontWeight: 'bold' }}>
                      Out of Stock
                    </button>
                  ) : (
                    <button className="add-to-cart-btn" onClick={() => addToCart(product)} style={{ marginTop: '10px', width: '100%', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                      <ShoppingCart size={18} /> Add to Cart
                    </button>
                  );
                })()}
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '12px', padding: '20px', maxWidth: '600px', width: '100%', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="close-btn" onClick={() => setSelectedProduct(null)} style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#666' }}>&times;</button>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '10px' }}>
              <div style={{ flex: '1 1 250px', textAlign: 'center' }}>
                <img src={selectedProduct.image_url || 'https://via.placeholder.com/250x200?text=No+Image'} alt={selectedProduct.name} style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px' }} />
              </div>
              <div style={{ flex: '1 1 250px' }}>
                <h2 style={{ marginBottom: '5px', color: '#333' }}>{selectedProduct.name}</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.9rem' }}>{selectedProduct.category_name} - {selectedProduct.variant}</p>
                
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #eee' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    <h3 style={{ color: 'var(--primary-color)', fontSize: '1.8rem', margin: 0 }}>
                      ₹{selectedProduct.price}
                    </h3>
                    {selectedProduct.original_price && (
                      <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '1rem' }}>
                        ₹{selectedProduct.original_price}
                      </span>
                    )}
                  </div>
                  
                  {selectedProduct.original_price && (
                    <p style={{ color: '#00b894', fontWeight: 'bold', marginTop: '5px', fontSize: '0.95rem' }}>
                      You Save: ₹{selectedProduct.original_price - selectedProduct.price}
                    </p>
                  )}
                  {selectedProduct.discount_text && (
                    <span style={{ display: 'inline-block', marginTop: '8px', background: '#e17055', color: 'white', padding: '4px 8px', fontSize: '0.8rem', borderRadius: '4px', fontWeight: 'bold' }}>
                        {selectedProduct.discount_text}
                    </span>
                  )}
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '8px', color: '#444' }}>About this item</h4>
                  <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#666' }}>
                    {selectedProduct.description || "A high-quality product from Dinesh Agencies. Perfect for your daily needs and fully guaranteed for freshness and quality."}
                  </p>
                </div>


                {(() => {
                  const qty = getCartQuantity(selectedProduct.id);
                  return qty > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '5px', background: '#f8f9fa', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', fontSize: '1.2rem' }}>
                      <button onClick={() => decreaseQuantity(selectedProduct.id)} style={{ padding: '10px 20px', background: 'white', color: '#333', border: 'none', borderRight: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 'bold', flex: 1, fontSize: '1.2rem' }}>-</button>
                      <span style={{ fontWeight: 'bold', padding: '0 20px', color: '#333' }}>{qty}</span>
                      <button onClick={() => addToCart(selectedProduct)} style={{ padding: '10px 20px', background: 'white', color: '#333', border: 'none', borderLeft: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 'bold', flex: 1, fontSize: '1.2rem' }}>+</button>
                    </div>
                  ) : selectedProduct.stock === 0 ? (
                    <button className="out-of-stock-btn" disabled style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '1.05rem', background: '#e0e0e0', color: '#888', border: 'none', borderRadius: '8px', cursor: 'not-allowed', fontWeight: 'bold' }}>
                      Out of Stock
                    </button>
                  ) : (
                    <button className="add-to-cart-btn" onClick={() => addToCart(selectedProduct)} style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '1.05rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                      <ShoppingCart size={20} /> Add to Cart
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Related Products */}
            <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
              <h3 style={{ marginBottom: '15px', color: '#444' }}>Related Products</h3>
              <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
                {products.filter(p => p.category_name === selectedProduct.category_name && p.id !== selectedProduct.id).slice(0, 5).map(related => (
                  <div key={related.id} style={{ minWidth: '150px', maxWidth: '150px', border: '1px solid #eee', borderRadius: '8px', padding: '10px', cursor: 'pointer', flexShrink: 0 }} onClick={() => setSelectedProduct(related)}>
                    <img src={related.image_url || 'https://via.placeholder.com/150'} alt={related.name} style={{ width: '100%', height: '100px', objectFit: 'contain', marginBottom: '10px' }} />
                    <h5 style={{ fontSize: '0.85rem', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#333' }}>{related.name}</h5>
                    <p style={{ fontWeight: 'bold', color: 'var(--primary-color)', fontSize: '0.9rem' }}>₹{related.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

