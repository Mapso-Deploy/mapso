import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';
import cityBackground from './assets/mapso-city-background.png';
import desktopFog from './assets/mapso-fog-desktop.mp4';
import mobileFog from './assets/mapso-fog-mobile.mp4';
import staticLogo from './assets/mapso-energy-logo.png';
import animatedLogo from './assets/mapso-energy-logo-hover.gif';

export default function Landing() {
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  // State to lock animation ensuring it plays fully before navigation
  const [isNavigating, setIsNavigating] = useState(false);

  // Loading state for fade-in effect
  const [isLoaded, setIsLoaded] = useState(false);
  const [heroMedia, setHeroMedia] = useState(() => ({
    isMobile: window.matchMedia('(max-width: 600px)').matches,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }));

  const navigate = useNavigate();
  const isLogoActive = isLogoHovered || isNavigating;

  useEffect(() => {
    // Preload images to prevent lag and sloppy background loading
    const imagesToPreload = [
      staticLogo,
      animatedLogo,
      cityBackground
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

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 600px)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateHeroMedia = () => setHeroMedia({
      isMobile: mobileQuery.matches,
      prefersReducedMotion: reducedMotionQuery.matches
    });

    mobileQuery.addEventListener('change', updateHeroMedia);
    reducedMotionQuery.addEventListener('change', updateHeroMedia);

    return () => {
      mobileQuery.removeEventListener('change', updateHeroMedia);
      reducedMotionQuery.removeEventListener('change', updateHeroMedia);
    };
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
      className="Logo landing-hero"
      style={{
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 1s ease-in-out'
      }}
    >
      <img
        className="landing-hero__background"
        src={cityBackground}
        alt=""
        aria-hidden="true"
      />
      {!heroMedia.prefersReducedMotion && (
        <video
          className="landing-hero__fog"
          src={heroMedia.isMobile ? mobileFog : desktopFog}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
      )}
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
