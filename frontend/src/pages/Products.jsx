import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ShoppingCart, Search, Filter, Plus, Minus, Check, CheckCircle2, 
  Truck, ShieldCheck, ArrowRight, Phone, Sparkles, Tag, X, ChevronRight,
  Package, Store, Info, ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import { PRODUCTS_DATA } from '../data/products';
import './Products.css';

const CATEGORIES = [
  { id: 'All', label: 'All Products', icon: '✨' },
  { id: 'Agarbatti', label: 'Cycle Agarbatti', icon: '🪔' },
  { id: 'Choco Pie', label: 'Lotte Choco Pie', icon: '🍫' },
  { id: 'Dhoop', label: 'Dhoop & Sambrani', icon: '🕯️' },
  { id: 'Puja', label: 'Pooja Combos', icon: '🕉️' },
  { id: 'Candy', label: 'Candies & Sweets', icon: '🍬' },
  { id: 'Toffee', label: 'Lotte Eclairs', icon: '🍯' },
  { id: 'Cooking Oil', label: 'Cooking Oil', icon: '🍶' },
  { id: 'Dishwash', label: 'Pitambari & Gel', icon: '🧼' },
  { id: 'Snack', label: 'Snacks & Sticks', icon: '🍪' }
];

// Helper to guarantee every stock item has wholesale discount badge, MRP, retail margin, and live stock calculation
const ensureDiscount = (product) => {
  const price = Number(product.price) || 10;
  let original_price = Number(product.original_price);
  let discount_text = product.discount_text;

  if (!original_price || original_price <= price) {
    const markupFactor = price <= 10 ? 1.25 : (price <= 50 ? 1.22 : (price <= 150 ? 1.20 : 1.18));
    original_price = Math.round(price * markupFactor);
    if (original_price <= price) original_price = price + 2;
  }

  if (!discount_text) {
    const pct = Math.round(((original_price - price) / original_price) * 100);
    discount_text = `${pct}% OFF`;
  }

  let stock = Number(product.stock !== undefined ? product.stock : 50);
  try {
    const stockOverrides = JSON.parse(localStorage.getItem('da_stock_overrides') || '{}');
    const localOrders = JSON.parse(localStorage.getItem('da_orders') || '[]');
    const pId = product.id || product._id;
    const pName = (product.name || '').trim().toLowerCase();

    if (pId && stockOverrides[pId] !== undefined) {
      stock = Number(stockOverrides[pId]);
    } else if (product.name && stockOverrides[product.name] !== undefined) {
      stock = Number(stockOverrides[product.name]);
    } else {
      let orderedQty = 0;
      localOrders.forEach(ord => {
        if (ord.status === 'CANCELLED') return;
        (ord.items || []).forEach(item => {
          const itemPid = item.id || item.product_id;
          const itemName = (item.name || '').trim().toLowerCase();
          if ((itemPid && itemPid === pId) || (itemName && itemName === pName)) {
            orderedQty += Number(item.quantity) || 1;
          }
        });
      });
      stock = Math.max(0, stock - orderedQty);
    }
  } catch (e) {}

  return {
    ...product,
    price,
    original_price,
    discount_text,
    margin: original_price - price,
    stock
  };
};

export default function Products({ addToCart, cartItems = [], setCartItems }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

  const [products, setProducts] = useState(() => PRODUCTS_DATA.map(ensureDiscount));
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('featured');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const savedUsername = localStorage.getItem('username') || '';
  const userRole = localStorage.getItem('userRole') || 'customer';

  // Fetch live products from backend
  useEffect(() => {
    const fetchLiveProducts = async () => {
      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await axios.get(`${apiUrl}/products`);
        if (res.data && res.data.length > 0) {
          setProducts(res.data.map(ensureDiscount));
        }
      } catch (err) {
        console.warn("Backend products fetch failed, using local product catalog:", err.message);
        setProducts(PRODUCTS_DATA.map(ensureDiscount));
      } finally {
        setLoading(false);
      }
    };
    fetchLiveProducts();
  }, []);

  // Listen for real-time stock deductions & updates
  useEffect(() => {
    const handleStockUpdate = () => {
      setProducts(prev => prev.map(ensureDiscount));
    };
    window.addEventListener('da_stock_updated', handleStockUpdate);
    window.addEventListener('storage', handleStockUpdate);
    return () => {
      window.removeEventListener('da_stock_updated', handleStockUpdate);
      window.removeEventListener('storage', handleStockUpdate);
    };
  }, []);

  // Sync category with URL search param
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    if (catId === 'All') {
      searchParams.delete('category');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: catId });
    }
  };

  const getCartQuantity = (id) => {
    const item = cartItems.find(i => i.id === id);
    return item ? item.quantity : 0;
  };

  const handleDecreaseQuantity = (id) => {
    if (!setCartItems) return;
    setCartItems(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, quantity: item.quantity - 1 } : item);
      return updated.filter(item => item.quantity > 0);
    });
  };

  const handleAddToCartWithToast = (product) => {
    addToCart(product);
    setToastMsg(`Added "${product.name}" to cart!`);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // Filter & Sort logic
  const filteredProducts = products.filter(p => {
    let matchesCategory = true;
    if (selectedCategory !== 'All') {
      matchesCategory = (p.category_name || '').toLowerCase() === selectedCategory.toLowerCase();
    }
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.category_name && p.category_name.toLowerCase().includes(q)) ||
      (p.variant && p.variant.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
    if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    return 0; // default featured
  });

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartValue = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="wholesale-products-page">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="products-toast-notification">
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── TOP HERO BANNER ── */}
      <section className="products-top-banner">
        <div className="banner-content-container">
          <div className="banner-flex">
            <div>
              <div className="banner-breadcrumb">
                <Link to="/">Home</Link>
                <ChevronRight size={14} />
                <span>Wholesale Ordering Desk</span>
              </div>
              <h1 className="banner-main-title">
                Wholesale Product Catalog & Ordering
              </h1>
              <p className="banner-subtext">
                Direct authorized factory distributor pricing for Cycle Pure Agarbatti, Lotte Confectionery & Pitambari products.
                {savedUsername && (
                  <span className="user-greeting-pill">
                    Logged in as <strong>{savedUsername}</strong> ({userRole})
                  </span>
                )}
              </p>
            </div>

            <div className="banner-metrics-card">
              <div className="metric-box">
                <span className="metric-num">50+</span>
                <span className="metric-lbl">Active Wholesale SKUs</span>
              </div>
              <div className="metric-divider" />
              <div className="metric-box">
                <span className="metric-num">24h</span>
                <span className="metric-lbl">Hub Dispatch</span>
              </div>
              <div className="metric-divider" />
              <div className="metric-box">
                <span className="metric-num">100%</span>
                <span className="metric-lbl">Factory Direct</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <section className="products-filter-section">
        <div className="filter-inner-container">
          <div className="filter-search-row">
            {/* Search Input */}
            <div className="search-bar-wrap">
              <Search size={18} className="search-icon-svg" />
              <input 
                type="text" 
                placeholder="Search products by brand, flavor, pack size, SKU..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input-field"
              />
              {searchQuery && (
                <button 
                  type="button" 
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="sort-dropdown-wrap">
              <span className="sort-label">Sort by:</span>
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                className="sort-select-input"
              >
                <option value="featured">Featured (Wholesale Priority)</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Product Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="category-pills-scroll">
            {CATEGORIES.map(cat => {
              const count = cat.id === 'All' 
                ? products.length 
                : products.filter(p => (p.category_name || '').toLowerCase() === cat.id.toLowerCase()).length;
              const isActive = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-pill-btn ${isActive ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  <span className="pill-icon">{cat.icon}</span>
                  <span className="pill-text">{cat.label}</span>
                  <span className="pill-badge">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS CARDS GRID ── */}
      <section className="products-catalog-section">
        <div className="catalog-container">
          <div className="catalog-status-bar">
            <span className="status-count-text">
              Showing <strong>{sortedProducts.length}</strong> items {selectedCategory !== 'All' ? `in "${selectedCategory}"` : 'across all wholesale categories'}
            </span>
            {searchQuery && (
              <span className="status-query-text">
                Matching: "<em>{searchQuery}</em>"
              </span>
            )}
          </div>

          {sortedProducts.length === 0 ? (
            <div className="no-products-found-card">
              <Package size={50} color="#94a3b8" />
              <h3>No products found</h3>
              <p>We couldn't find any products matching your search criteria.</p>
              <button 
                type="button" 
                className="reset-filters-btn"
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="wholesale-cards-grid">
              {sortedProducts.map(product => {
                const qty = getCartQuantity(product.id);
                const hasDiscount = product.original_price && product.original_price > product.price;
                const margin = hasDiscount ? product.original_price - product.price : 0;

                return (
                  <div key={product.id} className="wholesale-product-card">
                    {/* Image Area */}
                    <div 
                      className="card-media-wrap"
                      onClick={() => setSelectedProduct(product)}
                      title="Click to view details"
                    >
                      {product.discount_text && (
                        <span className="card-discount-badge">{product.discount_text}</span>
                      )}
                      {margin > 0 && !product.discount_text && (
                        <span className="card-margin-badge">Save ₹{margin}</span>
                      )}
                      <img 
                        src={product.image_url || 'https://via.placeholder.com/250x200?text=Product'} 
                        alt={product.name} 
                        loading="lazy"
                      />
                    </div>

                    {/* Content Area */}
                    <div className="card-details-wrap">
                      <div className="card-cat-row">
                        <span className="card-category-tag">{product.category_name}</span>
                        <span className="card-stock-indicator">
                          <span className="stock-dot" /> In Stock
                        </span>
                      </div>

                      <h3 
                        className="card-product-name"
                        onClick={() => setSelectedProduct(product)}
                        title={product.name}
                      >
                        {product.name}
                      </h3>

                      <div className="card-variant-row">
                        <span className="variant-label">Pack Variant:</span>
                        <span className="variant-value">{product.variant || 'Standard'}</span>
                      </div>

                      {/* Pricing */}
                      <div className="card-pricing-block">
                        <div className="price-main-row">
                          <span className="wholesale-currency">₹</span>
                          <span className="wholesale-price">{product.price}</span>
                          {product.original_price && (
                            <span className="retail-mrp-price">₹{product.original_price}</span>
                          )}
                        </div>
                        {margin > 0 && (
                          <div className="retail-profit-callout">
                            Retail margin: +₹{margin} per unit
                          </div>
                        )}
                      </div>

                      {/* Action Row */}
                      <div className="card-actions-row">
                        {qty > 0 ? (
                          <div className="qty-control-box">
                            <button 
                              type="button" 
                              className="qty-btn dec"
                              onClick={() => handleDecreaseQuantity(product.id)}
                              title="Decrease quantity"
                            >
                              <Minus size={15} />
                            </button>
                            <span className="qty-value-num">{qty}</span>
                            <button 
                              type="button" 
                              className="qty-btn inc"
                              onClick={() => addToCart(product)}
                              title="Increase quantity"
                            >
                              <Plus size={15} />
                            </button>
                          </div>
                        ) : Number(product.stock) === 0 ? (
                          <button className="card-out-of-stock-btn" disabled>
                            Out of Stock
                          </button>
                        ) : (
                          <button 
                            type="button" 
                            className="card-add-btn"
                            onClick={() => handleAddToCartWithToast(product)}
                          >
                            <ShoppingCart size={16} />
                            <span>Add to Cart</span>
                          </button>
                        )}

                        <a 
                          href={`https://wa.me/919566714372?text=${encodeURIComponent(`Hello Dinesh Agencies, I want to order wholesale stock for: ${product.name} (${product.variant || 'Standard'}) - ₹${product.price}`)}`}
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="card-wa-order-btn"
                          title="Instant WhatsApp Order"
                        >
                          <Phone size={14} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── FLOATING BOTTOM CART BAR ── */}
      {totalCartCount > 0 && (
        <div className="floating-cart-bar">
          <div className="cart-bar-container">
            <div className="cart-bar-info">
              <div className="cart-bar-icon-wrap">
                <ShoppingCart size={22} color="#ffffff" />
                <span className="cart-bar-badge">{totalCartCount}</span>
              </div>
              <div className="cart-bar-text">
                <span className="cart-bar-title">{totalCartCount} {totalCartCount === 1 ? 'item' : 'items'} in Wholesale Cart</span>
                <span className="cart-bar-sub">Total: <strong>₹{totalCartValue}</strong> (Ready for dispatch)</span>
              </div>
            </div>

            <div className="cart-bar-actions">
              <Link to="/cart" className="cart-bar-checkout-btn">
                <span>View Cart & Place Order</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── PRODUCT DETAILS MODAL ── */}
      {selectedProduct && (
        <div 
          className="product-modal-backdrop"
          onClick={() => setSelectedProduct(null)}
        >
          <div 
            className="product-modal-dialog"
            onClick={e => e.stopPropagation()}
          >
            <button 
              type="button"
              className="modal-close-cross"
              onClick={() => setSelectedProduct(null)}
            >
              &times;
            </button>

            <div className="modal-body-grid">
              {/* Left: Image */}
              <div className="modal-image-col">
                <img 
                  src={selectedProduct.image_url || 'https://via.placeholder.com/350x300?text=Product'} 
                  alt={selectedProduct.name} 
                />
              </div>

              {/* Right: Info */}
              <div className="modal-info-col">
                <span className="modal-category-pill">{selectedProduct.category_name}</span>
                <h2 className="modal-product-title">{selectedProduct.name}</h2>
                <div className="modal-variant-row">
                  <span>Pack Size / Variant: <strong>{selectedProduct.variant || 'Standard'}</strong></span>
                </div>

                <div className="modal-pricing-box">
                  <div className="modal-price-row">
                    <span className="modal-wholesale-price">₹{selectedProduct.price}</span>
                    {selectedProduct.original_price && (
                      <span className="modal-retail-mrp">₹{selectedProduct.original_price}</span>
                    )}
                  </div>
                  {selectedProduct.original_price && (
                    <span className="modal-margin-alert">
                      Retail Margin: ₹{selectedProduct.original_price - selectedProduct.price} per pack
                    </span>
                  )}
                </div>

                <div className="modal-description-box">
                  <h4>Product Description & Wholesale Specifications</h4>
                  <p>
                    {selectedProduct.description || "Authentic FMCG stock sourced directly from verified manufacturer batches. Factory sealed with tamper-proof packaging suitable for retail counter resale."}
                  </p>
                </div>

                <div className="modal-bottom-actions">
                  {(() => {
                    const qty = getCartQuantity(selectedProduct.id);
                    return qty > 0 ? (
                      <div className="modal-qty-counter">
                        <button onClick={() => handleDecreaseQuantity(selectedProduct.id)}>-</button>
                        <span>{qty} in Cart</span>
                        <button onClick={() => addToCart(selectedProduct)}>+</button>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        className="modal-add-cart-btn"
                        onClick={() => handleAddToCartWithToast(selectedProduct)}
                      >
                        <ShoppingCart size={18} />
                        <span>Add to Wholesale Cart</span>
                      </button>
                    );
                  })()}

                  <a 
                    href={`https://wa.me/919566714372?text=${encodeURIComponent(`Hello Dinesh Agencies, I want to order bulk quantity of: ${selectedProduct.name} (${selectedProduct.variant || 'Standard'})`)}`}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="modal-wa-btn"
                  >
                    <Phone size={16} />
                    <span>WhatsApp Order</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
