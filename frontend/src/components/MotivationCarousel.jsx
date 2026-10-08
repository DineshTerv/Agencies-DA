import React, { useState, useEffect } from 'react';
import './MotivationCarousel.css';

const slides = [
  {
    image: "/delivery-motivation.jpg",
    title: "Sales Team Excellence",
    text: "Delivery on proper time. Boost your results and achieve success, every mile!"
  },
  {
    image: "https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=600&q=80",
    title: "Team Collaboration",
    text: "Together we achieve more. Great communication leads to great sales!"
  },
  {
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80",
    title: "Smash Your Targets!",
    text: "Every small step counts towards the big goal. Keep pushing forward!"
  },
  {
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
    title: "Fast & Reliable",
    text: "Our reputation is built on speed and reliability. Make every delivery count."
  }
];

const MotivationCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(timer);
  }, []);

  return (
    <aside className="motivation-panel glass">
      <div className="motivation-card">
        <div className="carousel-images">
          {slides.map((slide, index) => (
            <img 
              key={index}
              src={slide.image} 
              alt={slide.title} 
              className={`motivation-img ${index === currentIndex ? 'active' : ''}`} 
            />
          ))}
        </div>
        
        <div className="motivation-text-container">
          {slides.map((slide, index) => (
            <div 
              key={index} 
              className={`motivation-text ${index === currentIndex ? 'active' : ''}`}
            >
              <h3>{slide.title}</h3>
              <p>{slide.text}</p>
            </div>
          ))}
        </div>

        <div className="carousel-indicators">
          {slides.map((_, index) => (
            <span 
              key={index} 
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
            ></span>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default MotivationCarousel;
