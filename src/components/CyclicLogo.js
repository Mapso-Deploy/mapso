import React, { useState, useEffect, useRef } from 'react';

// Secondary logos provided by the user
const SECONDARY_LOGOS = [
    'Neo-logo.png',
    'Hentai-logo copy (FINAL Black).png',
    'Katakana  logo.png',
    'New M Logo (Filled Final2).png'
];

const CyclicLogo = ({ mainLogo, alt, className, style, speed = 120 }) => {
    const [currentSrc, setCurrentSrc] = useState(mainLogo);
    const [isHovered, setIsHovered] = useState(false);
    const intervalRef = useRef(null);
    const indexRef = useRef(0);

    useEffect(() => {
        // Construct the full list of logos to cycle through
        const cyclingLogos = [
            mainLogo,
            ...SECONDARY_LOGOS.map(name => process.env.PUBLIC_URL + '/' + name)
        ];

        // Whenever isHovered changes:
        if (isHovered) {
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
    }, [isHovered, mainLogo, speed]);

    return (
        <img
            src={currentSrc}
            alt={alt}
            className={className}
            style={style}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        />
    );
};

export default CyclicLogo;
