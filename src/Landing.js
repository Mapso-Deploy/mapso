import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';
import cityBackground from './assets/mapso-city-background.png';
import desktopFog from './assets/mapso-fog-desktop.mp4';
import mobileFog from './assets/mapso-fog-mobile.mp4';
import fogFallback from './assets/mapso-fog-fallback.webp';
import staticLogo from './assets/mapso-energy-logo.png';
import animatedLogo from './assets/mapso-energy-logo-hover.gif';

export default function Landing() {
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  // State to lock animation ensuring it plays fully before navigation
  const [isNavigating, setIsNavigating] = useState(false);

  const fogRef = useRef(null);
  const [backgroundReady, setBackgroundReady] = useState(false);
  const [fogFallbackReady, setFogFallbackReady] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [heroMedia, setHeroMedia] = useState(() => ({
    isMobile: window.matchMedia('(max-width: 600px)').matches,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }));

  const navigate = useNavigate();
  const isLogoActive = isLogoHovered || isNavigating;
  const isSceneReady = backgroundReady && (heroMedia.prefersReducedMotion || fogFallbackReady);

  useEffect(() => {
    const imagesToPreload = [staticLogo, animatedLogo];

    const preloadImage = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = resolve;
        img.onerror = resolve; // Continue even if error
      });
    };

    imagesToPreload.forEach(preloadImage);
  }, []);

  const startFog = useCallback(() => {
    const video = fogRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    const playPromise = video.play();
    if (playPromise) playPromise.catch(() => setVideoPlaying(false));
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

    const navigationDelay = heroMedia.isMobile ? 2200 : 600;
    setTimeout(() => {
      navigate('/matter');
    }, navigationDelay);
  };

  const handleLogoKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLogoClick();
    }
  };

  return (
    <div
      className={`Logo landing-hero${isLogoActive ? ' is-logo-active' : ''}${isSceneReady ? ' is-ready' : ''}`}
      style={{
        opacity: isSceneReady ? 1 : 0
      }}
    >
      <img
        className="landing-hero__background"
        src={cityBackground}
        alt=""
        aria-hidden="true"
        onLoad={() => setBackgroundReady(true)}
      />
      {!heroMedia.prefersReducedMotion && (
        <>
          <img
            className={`landing-hero__fog-fallback${videoPlaying ? ' is-hidden' : ''}`}
            src={fogFallback}
            alt=""
            aria-hidden="true"
            onLoad={() => setFogFallbackReady(true)}
          />
          <video
            className={`landing-hero__fog${videoPlaying ? ' is-playing' : ''}`}
            ref={fogRef}
            src={heroMedia.isMobile ? mobileFog : desktopFog}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            onCanPlay={startFog}
            onLoadedData={startFog}
            onPlaying={() => setVideoPlaying(true)}
            onPause={() => setVideoPlaying(false)}
          />
        </>
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
