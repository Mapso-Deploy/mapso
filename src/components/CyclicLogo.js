import React, { useState, useEffect, useMemo, useRef } from 'react';

// Secondary logos provided by the user
const SECONDARY_LOGOS = [
    'Neo-logo.png',
    'Hentai-logo copy (FINAL Black).png',
    'Katakana  logo.png',
    'New M Logo (Filled Final2).png',
    'm og (bigger).png',
];

const getPublicAsset = (name) => `${process.env.PUBLIC_URL || ''}/${name}`;

const getReducedMotionPreference = () => {
    if (typeof window === 'undefined' || !window.matchMedia) {
        return false;
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const CyclicLogo = ({ mainLogo, alt, className = '', style, speed = 120, fadeDuration = 0, onClick, invertImages = false }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(getReducedMotionPreference);
    const intervalRef = useRef(null);
    const clickTimeoutRef = useRef(null);

    // Handle manual trigger (e.g. mobile click)
    const [isCycling, setIsCycling] = useState(false);

    // Combine hover and manual cycling state
    const shouldCycle = (isHovered || isCycling) && !prefersReducedMotion;
    const logoSources = useMemo(() => [
        mainLogo,
        ...SECONDARY_LOGOS.map(getPublicAsset)
    ], [mainLogo]);

    const handleClick = (e) => {
        // If we have an onClick prop, it means we want to hijack the click
        if (onClick) {
            e.preventDefault(); // Stop immediate navigation if it's a link

            if (prefersReducedMotion) {
                onClick(e);
                return;
            }

            if (!isCycling && !clickTimeoutRef.current) {
                setIsCycling(true);
                // Run cycling for a brief period then execute the callback
                clickTimeoutRef.current = setTimeout(() => {
                    setIsCycling(false);
                    clickTimeoutRef.current = null;
                    onClick(e); // Proceed with navigation
                }, Math.max(speed, 650));
            }
        }
    };

    useEffect(() => {
        const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');

        if (!mediaQuery) {
            return undefined;
        }

        const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
        mediaQuery.addEventListener?.('change', handleChange);
        mediaQuery.addListener?.(handleChange);

        return () => {
            mediaQuery.removeEventListener?.('change', handleChange);
            mediaQuery.removeListener?.(handleChange);
        };
    }, []);

    useEffect(() => {
        logoSources.forEach((src) => {
            const image = new Image();
            image.src = src;
        });
    }, [logoSources]);

    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (!shouldCycle || logoSources.length <= 1) {
            setActiveIndex(0);
            return undefined;
        }

        setActiveIndex((currentIndex) => (currentIndex + 1) % logoSources.length);
        intervalRef.current = setInterval(() => {
            setActiveIndex((currentIndex) => (currentIndex + 1) % logoSources.length);
        }, speed);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [shouldCycle, logoSources.length, speed]);

    useEffect(() => () => {
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }
    }, []);

    const wrapperStyle = {
        ...style,
        '--logo-cycle-fade-ms': `${fadeDuration}ms`
    };

    return (
        <div
            className={`cycling-logo ${className}`.trim()}
            style={wrapperStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
            onClick={handleClick}
        >
            {logoSources.map((src, index) => {
                const isActive = index === activeIndex;
                const isSecondary = index !== 0;
                const imageStyle = invertImages && isSecondary ? { filter: 'invert(1)' } : undefined;

                return (
                    <img
                        key={src}
                        className={`cycling-logo__image${isActive ? ' is-active' : ''}`}
                        src={src}
                        alt={isActive ? alt : ''}
                        aria-hidden={!isActive}
                        style={imageStyle}
                    />
                );
            })}
        </div>
    );
};

export default CyclicLogo;
