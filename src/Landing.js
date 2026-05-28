import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';
import bgImage from './clear-pale-cement-stucco-pattern.jpg'; // Import bg for preloading
import staticLogo from './assets/mapso-energy-logo.png';
import animatedLogo from './assets/mapso-energy-logo-hover.gif';

export default function Landing() {
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  // State to lock animation ensuring it plays fully before navigation
  const [isNavigating, setIsNavigating] = useState(false);

  // Loading state for fade-in effect
  const [isLoaded, setIsLoaded] = useState(false);

  const navigate = useNavigate();
  const isLogoActive = isLogoHovered || isNavigating;

  useEffect(() => {
    // Preload images to prevent lag and sloppy background loading
    const imagesToPreload = [
      staticLogo,
      animatedLogo,
      bgImage
    ];

    const preloadImage = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = resolve;
        img.onerror = resolve; // Continue even if error
      });
    };

    Promise.all(imagesToPreload.map(preloadImage))
      .then(() => {
        // Once essential images are loaded, trigger fade-in
        setIsLoaded(true);
      });

    // Fallback: If loading takes too long, show content anyway
    const timer = setTimeout(() => setIsLoaded(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogoClick = () => {
    if (isNavigating) return; // Prevent double clicks

    setIsNavigating(true);
    setIsLogoHovered(true); // Ensure animation plays

    setTimeout(() => {
      navigate('/matter');
    }, 600); // Wait for animation (~0.6s)
  };

  const handleLogoKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLogoClick();
    }
  };

  return (
    <div
      className="Logo"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        overflow: 'hidden',
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 1s ease-in-out'
      }}
    >
      <div
        className={`landing-logo-hitbox${isLogoActive ? ' is-hovered' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Enter Mapso"
        onMouseEnter={() => setIsLogoHovered(true)}
        onMouseLeave={() => {
          if (!isNavigating) setIsLogoHovered(false);
        }}
        onFocus={() => setIsLogoHovered(true)}
        onBlur={() => {
          if (!isNavigating) setIsLogoHovered(false);
        }}
        onTouchStart={() => setIsLogoHovered(true)}
        onTouchEnd={() => {
          if (!isNavigating) setIsLogoHovered(false);
        }}
        onClick={handleLogoClick}
        onKeyDown={handleLogoKeyDown}
      >
        <img
          className="landing-logo-image landing-logo-static"
          src={staticLogo}
          alt="Mapso logo"
        />
        {isLogoActive && (
          <img
            className="landing-logo-image landing-logo-animated"
            src={animatedLogo}
            alt=""
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
