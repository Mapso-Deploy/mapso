import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';
import bgImage from './clear-pale-cement-stucco-pattern.jpg'; // Import bg for preloading

export default function Landing() {
  const [isDesktopLogoHovered, setIsDesktopLogoHovered] = useState(false);
  const [isMobileLogoHovered, setIsMobileLogoHovered] = useState(false);

  // State to lock animation ensuring it plays fully before navigation
  const [isDesktopNavigating, setIsDesktopNavigating] = useState(false);
  const [isMobileNavigating, setIsMobileNavigating] = useState(false);

  // Loading state for fade-in effect
  const [isLoaded, setIsLoaded] = useState(false);

  const navigate = useNavigate();

  const staticLogo = "https://cdn.glitch.global/f341fe61-4868-4d79-bad9-1a5804bea407/Mapso%20(Energy)%204.png?v=1713580027089"; // Path to the static image of the logo
  const animatedLogo = "https://cdn.glitch.global/f341fe61-4868-4d79-bad9-1a5804bea407/Mapso%20(Energy)%204.gif?v=1713577237481"; // Path to the animated GIF
  const mobileStaticLogo = "https://cdn.glitch.global/f341fe61-4868-4d79-bad9-1a5804bea407/Mapso%20(Energy)%204.png?v=1713580027089"; // Static version for mobile logo
  const mobileAnimatedLogo = "https://cdn.glitch.global/f341fe61-4868-4d79-bad9-1a5804bea407/Mapso%20(Energy)%204.gif?v=1713577237481"; // Animated version for mobile logo

  useEffect(() => {
    // Preload images to prevent lag and sloppy background loading
    const imagesToPreload = [
      animatedLogo,
      mobileAnimatedLogo,
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

  const handleDesktopLogoClick = () => {
    if (isDesktopNavigating) return; // Prevent double clicks

    setIsDesktopNavigating(true);
    setIsDesktopLogoHovered(true); // Ensure animation plays

    setTimeout(() => {
      navigate('/Products');
    }, 2100); // Wait for animation (~0.6s)
  };

  const handleMobileLogoClick = () => {
    if (isMobileNavigating) return;

    setIsMobileNavigating(true);
    setIsMobileLogoHovered(true); // Ensure animation plays

    setTimeout(() => {
      navigate('/Products');
    }, 2100); // Delay in milliseconds before navigating
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
      <div className="animated-gif-box2">
        <img
          className="animated-gif2"
          src={isDesktopLogoHovered ? animatedLogo : staticLogo}
          alt="Desktop logo"
          onMouseEnter={() => setIsDesktopLogoHovered(true)}
          onMouseLeave={() => {
            if (!isDesktopNavigating) setIsDesktopLogoHovered(false);
          }}
          onTouchStart={() => setIsDesktopLogoHovered(true)}
          onTouchEnd={() => {
            if (!isDesktopNavigating) setIsDesktopLogoHovered(false);
          }}
          onClick={handleDesktopLogoClick}
        />
      </div>
      <div className="mobile-logo-box" style={{ overflow: 'hidden' }}>
        <img
          src={isMobileLogoHovered ? mobileAnimatedLogo : mobileStaticLogo}
          alt="Mobile logo"
          onClick={handleMobileLogoClick}
          // Added mouse handlers for Tablet/cursor support on small screens
          onMouseEnter={() => setIsMobileLogoHovered(true)}
          onMouseLeave={() => {
            if (!isMobileNavigating) setIsMobileLogoHovered(false);
          }}
          // Handle Touch
          onTouchStart={() => setIsMobileLogoHovered(true)}
          onTouchEnd={() => {
            if (!isMobileNavigating) setIsMobileLogoHovered(false);
          }}
          style={{ width: '600px', overflow: 'hidden', paddingBottom: '35px' }}
        />
      </div>
    </div>
  );
}
