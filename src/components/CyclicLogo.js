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

const CyclicLogo = ({ mainLogo, alt, className = '', style, speed = 120, onClick, invertImages = false }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(getReducedMotionPreference);
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

    useEffect(() => () => {
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }
    }, []);

    const wrapperStyle = {
        ...style,
        '--logo-cycle-step-ms': `${speed}ms`,
        '--logo-cycle-duration-ms': `${speed * logoSources.length}ms`
    };

    return (
        <div
            className={`cycling-logo ${shouldCycle ? 'is-cycling' : ''} ${className}`.trim()}
            style={wrapperStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
            onClick={handleClick}
        >
            {logoSources.map((src, index) => {
                const isActive = !shouldCycle && index === 0;
                const isSecondary = index !== 0;
                const imageStyle = {
                    ...(invertImages && isSecondary ? { filter: 'invert(1)' } : {}),
                    '--logo-cycle-delay-ms': `${index * speed}ms`
                };

                return (
                    <img
                        key={src}
                        className={`cycling-logo__image${isActive ? ' is-active' : ''}`}
                        src={src}
                        alt={index === 0 ? alt : ''}
                        aria-hidden={index !== 0}
                        style={imageStyle}
                    />
                );
            })}
        </div>
    );
};

export default CyclicLogo;
