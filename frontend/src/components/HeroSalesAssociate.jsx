import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, ShoppingBag, Sparkles, Star, 
  CheckCircle2, Flame, Volume2, VolumeX, ShieldCheck
} from 'lucide-react';
import './HeroSalesAssociate.css';

const SALES_PRODUCTS = [
  {
    id: 'C001',
    name: 'Cycle Pure Agarbathi',
    variant: '100s Pack',
    price: 60,
    mrp: 75,
    tag: 'Bestseller',
    category: 'Agarbatti',
    image_url: '/cycle_pure_100s.jpg'
  },
  {
    id: 'L010',
    name: 'Lotte Choco Pie',
    variant: 'Box (12 Packs)',
    price: 150,
    mrp: 180,
    tag: 'Trending',
    category: 'Confectionery',
    image_url: 'https://m.media-amazon.com/images/I/71Hq5mPf17L._AC_UF350,350_QL80_.jpg'
  },
  {
    id: 'P003',
    name: 'Pitambari Shining Powder',
    variant: '500g Jar',
    price: 110,
    mrp: 130,
    tag: 'Top Pooja Item',
    category: 'Home Care',
    image_url: 'https://www.pitambari.com/shop/wp-content/uploads/2025/02/Pitambari-Shining-Powder-1kg.jpg'
  },
  {
    id: 'C003',
    name: 'Cycle Three in One',
    variant: '250g Mega Pack',
    price: 150,
    mrp: 185,
    tag: 'High Margin',
    category: 'Agarbatti',
    image_url: '/cycle_pure_three_in_one.jpg'
  }
];

const DIALOGUES = [
  {
    text: "Vanakkam! 🙏 Dispatching fresh wholesale cartons for Dharmapuri & Salem shops today!",
    highlight: "Wholesale Dispatch"
  },
  {
    text: "✨ Today's top pick: Cycle Pure Agarbatti 100s! Authentic aroma & highest retailer margin.",
    highlight: "Cycle Pure 100s"
  },
  {
    text: "🍫 Fresh Lotte Choco Pie batch arrived directly from the Chennai factory line!",
    highlight: "Factory Fresh Lotte"
  },
  {
    text: "📦 Guaranteed same-day dispatch on bulk retailer orders placed before 4:00 PM.",
    highlight: "Same-Day Dispatch"
  }
];

// Play soft ambient audio chime via Web Audio API without external file requirements
const playFeedbackChime = (enabled) => {
  if (!enabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    
    // Smooth dual-tone melodic chime (C6 -> G6)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, now); // C6
    osc1.frequency.exponentialRampToValueAtTime(1567.98, now + 0.14); // G6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(523.25, now); // C5
    osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.14); // G5

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.38);
    osc2.stop(now + 0.38);
  } catch {
    // Non-blocking fallback
  }
};

export default function HeroSalesAssociate({ addToCart }) {
  const [dialogueIdx, setDialogueIdx] = useState(0);
  const [productIdx, setProductIdx] = useState(0);
  const [isPacking, setIsPacking] = useState(false);
  const [packingProgress, setPackingProgress] = useState(0);
  const [packingStep, setPackingStep] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [packedBoxesCount, setPackedBoxesCount] = useState(1482);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 3D Tilt & Parallax Physics State
  const cardRef = useRef(null);
  const [tiltStyle, setTiltStyle] = useState({
    transform: 'perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    shineX: 50,
    shineY: 50,
    isHovered: false
  });

  // Rotate dialogues every 5.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setDialogueIdx(prev => (prev + 1) % DIALOGUES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // Rotate product showcase every 8s if not packing
  useEffect(() => {
    if (isPacking) return;
    const timer = setInterval(() => {
      setProductIdx(prev => (prev + 1) % SALES_PRODUCTS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [isPacking]);

  const activeProduct = SALES_PRODUCTS[productIdx];

  // Mouse move handler for smooth 3D tilt & sheen
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    // Tilt angles (max 10 degrees)
    const rotateX = ((rect.height / 2 - y) / (rect.height / 2)) * 8;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 8;

    setTiltStyle({
      transform: `perspective(1100px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.018, 1.018, 1.018)`,
      shineX: xPercent,
      shineY: yPercent,
      isHovered: true
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      shineX: 50,
      shineY: 50,
      isHovered: false
    });
  };

  // Pack & Add to Cart simulation
  const handlePackAndSell = () => {
    if (isPacking) return;
    setIsPacking(true);
    setPackingProgress(12);
    setPackingStep('📦 Picking item from warehouse shelf...');
    playFeedbackChime(soundEnabled);

    setTimeout(() => {
      setPackingProgress(48);
      setPackingStep(`🏷️ Packing ${activeProduct.name} & sealing carton...`);
    }, 650);

    setTimeout(() => {
      setPackingProgress(82);
      setPackingStep('🚚 Applying Dinesh Agencies wholesale dispatch label...');
    }, 1300);

    setTimeout(() => {
      setPackingProgress(100);
      setPackingStep('✅ Packed & Added to Cart!');
      setPackedBoxesCount(c => c + 1);
      playFeedbackChime(soundEnabled);

      if (addToCart) {
        addToCart(activeProduct);
      }

      setToastMessage(`✓ ${activeProduct.name} (${activeProduct.variant}) packed into your wholesale cart!`);

      setTimeout(() => {
        setIsPacking(false);
        setPackingProgress(0);
        setPackingStep('');
      }, 1100);

      setTimeout(() => {
        setToastMessage('');
      }, 4200);
    }, 2000);
  };

  return (
    <div className="hero-associate-wrapper">
      {/* Live Hub Dispatch Indicator */}
      <div className="associate-top-status-bar">
        <div className="live-hub-pill">
          <span className="live-radar-dot"></span>
          <span className="hub-text">LIVE DISPATCH HUB • DHARMAPURI</span>
        </div>
        <div className="daily-stats-pill">
          <Package size={13} className="text-amber" />
          <span className="count-number">{packedBoxesCount}</span>
          <span className="count-lbl">Cartons Dispatched Today</span>
        </div>
        <button 
          type="button" 
          className="sound-toggle-btn" 
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? "Mute interactive audio" : "Enable interactive audio"}
        >
          {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
        </button>
      </div>

      {/* Main 3D Interactive Showcase Card */}
      <div 
        ref={cardRef}
        className={`interactive-showcase-stage ${tiltStyle.isHovered ? 'hover-active' : ''}`}
        style={{ transform: tiltStyle.transform }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Animated dynamic gloss / shine layer following mouse */}
        <div 
          className="dynamic-sheen-overlay"
          style={{
            background: tiltStyle.isHovered 
              ? `radial-gradient(circle 320px at ${tiltStyle.shineX}% ${tiltStyle.shineY}%, rgba(255, 255, 255, 0.18), rgba(255, 159, 67, 0.08) 45%, transparent 75%)`
              : 'none'
          }}
        />

        {/* Top Watermark & Agency Branding */}
        <div className="stage-top-brand-row">
          <div className="brand-watermark-tag">
            <span className="watermark-glow-dot"></span>
            <span className="watermark-text">DINESH AGENCIES</span>
            <span className="watermark-sep">•</span>
            <span className="watermark-sub">WHOLESALE NETWORK</span>
          </div>
          <div className="brand-verified-chip">
            <ShieldCheck size={12} color="#10b981" />
            <span>DIRECT DISTRIBUTOR</span>
          </div>
        </div>

        {/* Interactive Speech & Live Dialogue Pill */}
        <div 
          className="stage-speech-bubble"
          onClick={() => {
            setDialogueIdx(prev => (prev + 1) % DIALOGUES.length);
            playFeedbackChime(soundEnabled);
          }}
          title="Click to see next dispatch update"
        >
          <div className="bubble-speaker-meta">
            <div className="speaker-avatar-wrap">
              <span className="speaker-avatar-dot"></span>
            </div>
            <div className="speaker-identity">
              <span className="speaker-name">Priya Sundaram</span>
              <span className="speaker-role">Head of Retail Partnerships</span>
            </div>
            <span className="dialogue-tap-hint">Tap to rotate ↻</span>
          </div>
          <p className="bubble-message-text">{DIALOGUES[dialogueIdx].text}</p>
        </div>

        {/* Floating Product Quick Deal Showcase Card (Top-Right) */}
        <div className="floating-product-deal-card">
          <div className="fpdc-header">
            <span className="fpdc-pill">
              <Flame size={11} /> {activeProduct.tag}
            </span>
            <span className="fpdc-rating">
              <Star size={11} fill="#f59e0b" color="#f59e0b" /> 4.9
            </span>
          </div>

          <div className="fpdc-body">
            <img 
              src={activeProduct.image_url} 
              alt={activeProduct.name} 
              className="fpdc-img"
            />
            <div className="fpdc-details">
              <h5 className="fpdc-name">{activeProduct.name}</h5>
              <span className="fpdc-variant">{activeProduct.variant}</span>
              <div className="fpdc-pricing">
                <span className="fpdc-price">₹{activeProduct.price}</span>
                <span className="fpdc-mrp">MRP ₹{activeProduct.mrp}</span>
              </div>
            </div>
          </div>

          <button 
            type="button" 
            className="fpdc-quick-btn"
            onClick={handlePackAndSell}
            disabled={isPacking}
          >
            {isPacking ? (
              <>
                <Package size={13} className="spin-icon" /> Packing...
              </>
            ) : (
              <>
                <ShoppingBag size={13} /> 1-Click Pack (₹{activeProduct.price})
              </>
            )}
          </button>
        </div>

        {/* Central Realistic Portrait with Ambient Glow & Parallax */}
        <div className="stage-photo-viewport">
          <img 
            src="/female_executive.jpg" 
            alt="Priya Sundaram - Dinesh Agencies Wholesale Executive Lead" 
            className="stage-executive-img"
          />

          {/* Ambient Rim Lighting & Bottom Gradient Blend */}
          <div className="stage-photo-vignette"></div>
          <div className="stage-ambient-warm-glow"></div>

          {/* Bottom Overlay: Signature & Metrics Bar (inspired by the sample image) */}
          <div className="stage-metrics-dock">
            <div className="metric-box">
              <span className="metric-value">4.9 ★</span>
              <span className="metric-label">RETAILER TRUST</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-box">
              <span className="metric-value">1,500+</span>
              <span className="metric-label">ACTIVE SHOPS</span>
            </div>
            <div className="metric-divider"></div>
            <div className="metric-box">
              <span className="metric-value">24 Hrs</span>
              <span className="metric-label">DISPATCH</span>
            </div>
          </div>
        </div>

        {/* Bottom Interactive Order Packaging Console */}
        <div className="stage-packaging-console">
          {/* Progress bar active when packing */}
          {isPacking && (
            <div className="live-progress-container">
              <div className="progress-info-row">
                <span className="step-text">{packingStep}</span>
                <span className="pct-text">{packingProgress}%</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${packingProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Console Action Bar */}
          <div className="console-action-row">
            <button 
              type="button" 
              className={`main-pack-btn ${isPacking ? 'is-packing' : ''}`}
              onClick={handlePackAndSell}
              disabled={isPacking}
            >
              <Sparkles size={16} />
              <span>{isPacking ? 'Sealing Wholesale Carton...' : `Pack ${activeProduct.name}`}</span>
            </button>

            <button 
              type="button" 
              className="switch-deal-btn"
              onClick={() => {
                setProductIdx(prev => (prev + 1) % SALES_PRODUCTS.length);
                playFeedbackChime(soundEnabled);
              }}
              title="Next Featured Product"
            >
              Next Deal →
            </button>
          </div>
        </div>
      </div>

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="associate-toast-banner">
          <CheckCircle2 size={17} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
