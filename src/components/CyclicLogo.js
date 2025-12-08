import React, { useState, useEffect, useRef } from 'react';

// Secondary logos provided by the user
const SECONDARY_LOGOS = [
    'Neo-logo.png',
    'Hentai-logo copy (FINAL Black).png',
    'Katakana  logo.png',
    'New M Logo (Filled Final2).png',
    'm og (bigger).png',
];

const CyclicLogo = ({ mainLogo, alt, className, style, speed = 120, onClick, invertImages = false }) => {
    const [currentSrc, setCurrentSrc] = useState(mainLogo);
    const [isHovered, setIsHovered] = useState(false);
    const intervalRef = useRef(null);
    const indexRef = useRef(0);

    // Handle manual trigger (e.g. mobile click)
    const [isCycling, setIsCycling] = useState(false);

    // Combine hover and manual cycling state
    const shouldCycle = isHovered || isCycling;

    const handleClick = (e) => {
        // If we have an onClick prop, it means we want to hijack the click
        if (onClick) {
            e.preventDefault(); // Stop immediate navigation if it's a link
            if (!isCycling) {
                setIsCycling(true);
                // Run cycling for a brief period then execute the callback
                setTimeout(() => {
                    setIsCycling(false);
                    onClick(e); // Proceed with navigation
                }, 600); // 600ms = 5 rapid cycles at 120ms
            }
        }
    };

    useEffect(() => {
        // Construct the full list of logos to cycle through
        const cyclingLogos = [
            mainLogo,
            ...SECONDARY_LOGOS.map(name => process.env.PUBLIC_URL + '/' + name)
        ];

        // Whenever shouldCycle changes:
        if (shouldCycle) {
            // Start cycling
            // Start from index 1 since we are alreay showing index 0 (mainLogo) or just cycle immediately
            // To make it feel "high speed", we can start immediately
            indexRef.current = 0; // We are currently at mainLogo which is index 0

            intervalRef.current = setInterval(() => {
                // Increment index
                indexRef.current = (indexRef.current + 1) % cyclingLogos.length;
                setCurrentSrc(cyclingLogos[indexRef.current]);
            }, speed);
        } else {
            // Stop cycling and reset to main logo
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setCurrentSrc(mainLogo);
        }

        // Cleanup on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [shouldCycle, mainLogo, speed]);

    // Apply invert filter if requested AND we are showing a secondary logo
    const isSecondary = currentSrc !== mainLogo;

    const imageStyle = {
        filter: (invertImages && isSecondary) ? 'invert(1)' : style?.filter,
        height: '100%',
        width: 'auto',
        position: 'absolute',
        top: 0,
        left: 0,
        objectFit: 'contain'
    };

    const ghostStyle = {
        height: '100%',
        width: 'auto',
        opacity: 0,
        pointerEvents: 'none',
        visibility: 'hidden'
    };

    // Use a wrapper to maintain the hover area defined by the Main Logo's dimensions.
    // This prevents the "mouse leave" event when switching to a narrower logo (like the M).
    return (
        <div
            className={className}
            style={{ ...style, position: 'relative', display: 'inline-block' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
        >
            {/* Ghost Image to hold dimensions (invisible) */}
            <img src={mainLogo} alt="" style={ghostStyle} aria-hidden="true" />

            {/* Visible Cycling Image (absolute on top) */}
            <img
                src={currentSrc}
                alt={alt}
                style={imageStyle}
            />
        </div>
    );
};

export default CyclicLogo;
