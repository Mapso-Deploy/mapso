import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function Cursor() {
    const [isHovered, setIsHovered] = useState(false);

    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);

    // 1. Circle Spring (Tight)
    const circleConfig = { damping: 20, stiffness: 800, mass: 0.2 };
    const circleX = useSpring(mouseX, circleConfig);
    const circleY = useSpring(mouseY, circleConfig);

    // 2. Crosshair Spring (Loose/Magnetic)
    const crosshairConfig = { damping: 40, stiffness: 200, mass: 1.5 };
    const crosshairX = useSpring(mouseX, crosshairConfig);
    const crosshairY = useSpring(mouseY, crosshairConfig);

    useEffect(() => {
        // Simple cursor suppression - inject style tag once
        const styleId = 'cursor-kill-switch';

        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                html, body, * {
                    cursor: none !important;
                }
            `;
            document.head.appendChild(style);
        }

        // Set body cursor once
        document.body.style.cursor = 'none';
        document.documentElement.style.cursor = 'none';

        const moveCursor = (e) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        const handleMouseOver = (e) => {
            const target = e.target;
            const clickable =
                target.tagName.toLowerCase() === 'a' ||
                target.tagName.toLowerCase() === 'button' ||
                target.onclick ||
                target.closest('a') ||
                target.closest('button');

            setIsHovered(clickable);
        };

        window.addEventListener("mousemove", moveCursor);
        window.addEventListener("mouseover", handleMouseOver);

        return () => {
            window.removeEventListener("mousemove", moveCursor);
            window.removeEventListener("mouseover", handleMouseOver);
        };
    }, [mouseX, mouseY]);

    // Container: Handle Rotation
    const crosshairContainerVariants = {
        default: { rotate: 0, scale: 1 },
        hover: {
            rotate: 360,
            scale: 0.8,
            transition: { type: "spring", stiffness: 150, damping: 15 }
        }
    };

    // Ticks: Handle Flashing/Recoil (Shooter Effect)
    const tickVariants = {
        default: { opacity: 0.5, scale: 1 },
        hover: {
            opacity: [1, 0.3, 1, 0.3, 1], // Rapid flicker
            scale: [1, 1.1, 0.95, 1], // Recoil pulse
            transition: {
                duration: 0.5,
                repeat: Infinity,
                repeatType: "reverse"
            }
        }
    };

    return (
        <>
            <style>{`
        /* Nuclear Option for Cursor Hiding */
        html, body, #root, * {
          cursor: none !important;
        }
        /* Specific overrides for likely offenders */
        a, button, [role="button"], input, select, textarea, canvas {
          cursor: none !important;
        }
        /* Snipcart Override */
        .snipcart-layout, .snipcart-base, .snipcart-modal__container, .snipcart-modal__container * {
           cursor: none !important;
        }
        .snipcart-btn, .snipcart-checkout {
           cursor: none !important;
        }

        /* NO EXCEPTIONS */
        iframe, iframe * {
          cursor: none !important;
        }
      `}</style>

            {/* 2. Crosshair Layer */}
            <motion.div
                style={{
                    translateX: crosshairX,
                    translateY: crosshairY,
                    position: "fixed",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                    zIndex: 9998,
                    x: -30,
                    y: -30,
                    width: 60,
                    height: 60,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                variants={crosshairContainerVariants}
                animate={isHovered ? "hover" : "default"}
            >
                <motion.div variants={tickVariants} style={{ width: "100%", height: "100%", position: 'relative' }}>
                    {/* Top Tick */}
                    <div style={{ position: "absolute", top: 0, left: "50%", width: "1px", height: "12px", background: "rgb(80, 80, 80)", transform: "translateX(-50%)" }}></div>
                    {/* Bottom Tick */}
                    <div style={{ position: "absolute", bottom: 0, left: "50%", width: "1px", height: "12px", background: "rgb(80, 80, 80)", transform: "translateX(-50%)" }}></div>
                    {/* Left Tick */}
                    <div style={{ position: "absolute", left: 0, top: "50%", width: "12px", height: "1px", background: "rgb(80, 80, 80)", transform: "translateY(-50%)" }}></div>
                    {/* Right Tick */}
                    <div style={{ position: "absolute", right: 0, top: "50%", width: "12px", height: "1px", background: "rgb(80, 80, 80)", transform: "translateY(-50%)" }}></div>
                </motion.div>
            </motion.div>

            {/* 1. Circle/Dot Layer */}
            <motion.div
                style={{
                    translateX: circleX,
                    translateY: circleY,
                    position: "fixed",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                    zIndex: 9999,
                }}
                animate={{
                    width: isHovered ? 8 : 20,
                    height: isHovered ? 8 : 20,
                    backgroundColor: isHovered ? "#4cffa0" : "transparent",
                    // Dark Grey Border
                    border: isHovered ? "none" : "1.5px solid rgb(130, 130, 130)",
                    x: isHovered ? -4 : -10,
                    y: isHovered ? -4 : -10,
                    borderRadius: "50%",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
        </>
    );
}
