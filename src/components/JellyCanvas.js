import React, { useRef, useEffect } from 'react';

const JellyCanvas = ({ isLightMode }) => {
    const canvasRef = useRef(null);

    // ==========================================
    // 🔧 TWEAKING VALUES
    // ==========================================
    // Mouse State needs to be outside the effect to be shared or useRef
    // But since we only have one instance, local vars inside useEffect are fine.

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Configuration
        // Configuration
        let config = {
            top: { spring: 0.1, friction: 0.8, drag: 0.05 },
            right: { spring: 0.1, friction: 0.8, drag: 0.2 },
            left: { spring: 0.1, friction: 0.8, drag: 0.2 },
            bottom: { spring: 0.06, friction: 0.81, drag: 0.35 }
        };

        const sides = { top: [], right: [], bottom: [], left: [] };
        let width, height;

        // Dynamic Settings (Modified in initPoints)
        let navHeight = 85;
        let tailThickness = 200;
        let tailLength = 200;
        let volumeRadius = 200;
        const volumeForce = 0.55;
        const navX = 15;
        const navY = 15;
        const cornerRadius = 25; // Could scale this too if needed

        const initPoints = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;

            // RESPONSIVE LOGIC
            // Mobile Breakpoint (e.g. 768px matches typical tablet/mobile split)
            if (width < 768) {
                navHeight = 85;
                tailThickness = 120;
                volumeRadius = 120;
                tailLength = 100;
                // Mobile physics (Original)
                config.bottom = { spring: 0.06, friction: 0.81, drag: 0.35 };
            } else {
                navHeight = 85;
                tailThickness = 200;
                volumeRadius = 200;
                tailLength = 200;

                // DESKTOP LOGIC
                if (isLightMode) {
                    // [LIGHT MODE PATCH]
                    // Stronger physics to counter iframe lag & ensure tail visibility
                    config.bottom = { spring: 0.12, friction: 0.8, drag: 0.6 };
                    config.top = { spring: 0.15, friction: 0.8, drag: 0.1 };
                } else {
                    // [DARK MODE / DEFAULT] - PRESERVED EXACTLY
                    config.bottom = { spring: 0.06, friction: 0.81, drag: 0.35 };
                    config.top = { spring: 0.1, friction: 0.8, drag: 0.05 };
                }
            }

            const totalWidth = width - 30;
            const gap = 5;

            // Helper to fill arrays
            const fill = (startX, endX, y, ox, oy) => {
                const arr = [];
                for (let x = startX; x <= endX; x += gap) {
                    arr.push({ x, y, ox: x, oy: y, vx: 0, vy: 0 });
                }
                return arr;
            };

            // 1. TOP
            sides.top = fill(navX + cornerRadius, navX + totalWidth - cornerRadius, navY, 0, navY);
            sides.top.forEach(p => { p.ox = p.x; p.oy = navY; });
            sides.top.push({ x: navX + totalWidth - cornerRadius, y: navY, ox: navX + totalWidth - cornerRadius, oy: navY, vx: 0, vy: 0 });

            // 2. RIGHT
            const rightX = navX + totalWidth;
            sides.right = [];
            for (let y = navY + cornerRadius; y <= navY + navHeight - cornerRadius; y += gap) {
                sides.right.push({ x: rightX, y, ox: rightX, oy: y, vx: 0, vy: 0 });
            }
            sides.right.push({ x: rightX, y: navY + navHeight - cornerRadius, ox: rightX, oy: navY + navHeight - cornerRadius, vx: 0, vy: 0 });

            // 3. BOTTOM
            sides.bottom = fill(navX + cornerRadius, navX + totalWidth - cornerRadius, navY + navHeight, 0, navY + navHeight);
            sides.bottom.forEach(p => { p.ox = p.x; p.oy = navY + navHeight; });
            sides.bottom.push({ x: navX + totalWidth - cornerRadius, y: navY + navHeight, ox: navX + totalWidth - cornerRadius, oy: navY + navHeight, vx: 0, vy: 0 });

            // 4. LEFT
            const leftX = navX;
            sides.left = [];
            for (let y = navY + cornerRadius; y <= navY + navHeight - cornerRadius; y += gap) {
                sides.left.push({ x: leftX, y, ox: leftX, oy: y, vx: 0, vy: 0 });
            }
            sides.left.push({ x: leftX, y: navY + navHeight - cornerRadius, ox: leftX, oy: navY + navHeight - cornerRadius, vx: 0, vy: 0 });
        };

        const mouse = { x: -1000, y: -1000, vx: 0, vy: 0, lastX: -1000, lastY: -1000 };
        const speedLimit = 35;
        let lastInputTime = 0; // Timestamp of last real input

        // Shared handler for updating position and velocity
        const updateInput = (x, y) => {
            lastInputTime = Date.now(); // Mark activity

            mouse.lastX = mouse.x;
            mouse.lastY = mouse.y;
            mouse.x = x;
            mouse.y = y;

            // Compute raw velocity
            if (mouse.lastX === -1000 || mouse.lastY === -1000) {
                mouse.vx = 0;
                mouse.vy = 0;
            } else {
                const rawVx = x - mouse.lastX;
                const rawVy = y - mouse.lastY;
                mouse.vx = Math.max(Math.min(rawVx, speedLimit), -speedLimit);
                mouse.vy = Math.max(Math.min(rawVy, speedLimit), -speedLimit);
            }
        }

        const handleMouseMove = (e) => {
            updateInput(e.clientX, e.clientY);
        };

        const handleTouchMove = (e) => {
            const touch = e.touches[0];
            updateInput(touch.clientX, touch.clientY);
        };

        const handleTouchStart = (e) => {
            const touch = e.touches[0];
            lastInputTime = Date.now();

            // [DRAG ONLY FIX]
            // We do NOT update mouse.x/y to the touch position yet.
            // We keep mouse.x/y at -1000 (offscreen).
            // We ONLY update lastX/Y so that when the FIRST 'touchmove' happens,
            // the velocity calc (current - last) is correct and doesn't explode.

            mouse.lastX = touch.clientX;
            mouse.lastY = touch.clientY;
            // mouse.x & mouse.y stay at -1000.

            mouse.vx = 0;
            mouse.vy = 0;
        };

        const handleEnd = () => {
            mouse.x = -1000;
            mouse.y = -1000;
            mouse.vx = 0;
            mouse.vy = 0;
        };

        initPoints();
        window.addEventListener('resize', initPoints);

        // Mouse Listeners
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleEnd);

        // Touch Listeners
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchend', handleEnd);
        window.addEventListener('touchcancel', handleEnd); // Handle interruption

        const updateSidePhysics = (points, settings, sideName) => {
            points.forEach(p => {
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);

                // 1. Static Volume Displacement (Bulge based on proximity)
                // Only if mouse is "active" (on screen)
                if (mouse.x > -500 && dist < volumeRadius) {
                    const norm = dist / volumeRadius;
                    const volC = Math.pow(1 - norm, 2) * volumeForce;
                    p.vx += Math.cos(angle) * volC * 2;
                    p.vy += Math.sin(angle) * volC * 2;
                }

                // 2. Dynamic Drag (The "Tail")
                if (dist < tailThickness) {
                    const norm = dist / tailThickness;
                    const influence = Math.pow(1 - norm, 2);

                    if (Math.abs(mouse.vx) > 0.1 || Math.abs(mouse.vy) > 0.1) {
                        let forceX = mouse.vx * settings.drag * influence;
                        let forceY = mouse.vy * settings.drag * influence;

                        // [ASYMMETRY LOGIC]
                        let isPushingIn = false;
                        if (sideName === 'bottom' && mouse.vy < 0) isPushingIn = true;
                        if (sideName === 'top' && mouse.vy > 0) isPushingIn = true;
                        if (sideName === 'left' && mouse.vx > 0) isPushingIn = true;
                        if (sideName === 'right' && mouse.vx < 0) isPushingIn = true;

                        if (isPushingIn) {
                            forceX *= 0.1;
                            forceY *= 0.1;
                        } else {
                            forceX *= 1.2;
                            forceY *= 1.2;
                        }

                        p.vx += forceX;
                        p.vy += forceY;
                    }
                }

                // 3. Spring Back
                const ax = (p.ox - p.x) * settings.spring;
                const ay = (p.oy - p.y) * settings.spring;
                p.vx += ax;
                p.vy += ay;

                // 4. Soft Constraints
                const dOx = p.x - p.ox;
                const dOy = p.y - p.oy;
                const disp = Math.sqrt(dOx * dOx + dOy * dOy);

                if (disp > tailLength) {
                    const excess = disp - tailLength;
                    const limitForce = excess * 0.15;
                    const returnAngle = Math.atan2(dOy, dOx);
                    p.vx -= Math.cos(returnAngle) * limitForce;
                    p.vy -= Math.sin(returnAngle) * limitForce;
                }

                // Inside-Out Protection
                if (sideName === 'bottom' && p.y < p.oy - 15) p.vy += 0.5;
                if (sideName === 'top' && p.y > p.oy + 15) p.vy -= 0.5;

                // 5. Friction
                p.vx *= settings.friction;
                p.vy *= settings.friction;

                // 6. Update
                p.x += p.vx;
                p.y += p.vy;
            });
        };

        const update = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // TIME-BASED DECAY & RESET
            const timeSinceInput = Date.now() - lastInputTime;

            // Standard decay (Original)
            if (timeSinceInput > 140) {
                mouse.vx *= 0.6;
                mouse.vy *= 0.6;
                if (Math.abs(mouse.vx) < 0.1) mouse.vx = 0;
                if (Math.abs(mouse.vy) < 0.1) mouse.vy = 0;
            }

            // [LIGHT MODE GLITCH FIX]
            // If we are in light mode (iframe) and haven't had input for 250ms,
            // FORCE RESET the mouse position. This kills the "static bulge" 
            // that gets stuck when the iframe steals the cursor focus.
            if (isLightMode && timeSinceInput > 250) {
                mouse.x = -1000;
                mouse.y = -1000;
            }

            updateSidePhysics(sides.top, config.top, 'top');
            updateSidePhysics(sides.right, config.right, 'right');
            updateSidePhysics(sides.bottom, config.bottom, 'bottom');
            updateSidePhysics(sides.left, config.left, 'left');

            // Draw
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 10;

            ctx.beginPath();

            // --- DRAWING LOGIC ---
            if (sides.top.length > 0) {
                ctx.moveTo(sides.top[0].x, sides.top[0].y);
                for (let i = 1; i < sides.top.length; i++) {
                    const p = sides.top[i];
                    const prev = sides.top[i - 1];
                    const cx = (prev.x + p.x) / 2;
                    const cy = (prev.y + p.y) / 2;
                    ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
                }
            }

            // Top Right Corner & Right Side
            ctx.quadraticCurveTo(navX + (width - 30), navY, sides.right[0].x, sides.right[0].y);
            for (let i = 1; i < sides.right.length; i++) {
                const p = sides.right[i];
                const prev = sides.right[i - 1];
                const cx = (prev.x + p.x) / 2;
                const cy = (prev.y + p.y) / 2;
                ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
            }

            // Bottom Right Corner & Bottom Side (Reverse)
            ctx.quadraticCurveTo(navX + (width - 30), navY + navHeight, sides.bottom[sides.bottom.length - 1].x, sides.bottom[sides.bottom.length - 1].y);
            for (let i = sides.bottom.length - 2; i >= 0; i--) {
                const p = sides.bottom[i];
                const prev = sides.bottom[i + 1];
                const cx = (prev.x + p.x) / 2;
                const cy = (prev.y + p.y) / 2;
                ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
            }

            // Bottom Left Corner & Left Side (Reverse)
            ctx.quadraticCurveTo(navX, navY + navHeight, sides.left[sides.left.length - 1].x, sides.left[sides.left.length - 1].y);
            for (let i = sides.left.length - 2; i >= 0; i--) {
                const p = sides.left[i];
                const prev = sides.left[i + 1];
                const cx = (prev.x + p.x) / 2;
                const cy = (prev.y + p.y) / 2;
                ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
            }

            // Top Left Corner
            ctx.quadraticCurveTo(navX, navY, sides.top[0].x, sides.top[0].y);

            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            requestAnimationFrame(update);
        };

        animationFrameId = requestAnimationFrame(update);
        return () => {
            window.removeEventListener('resize', initPoints);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleEnd);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleEnd);
            window.removeEventListener('touchcancel', handleEnd);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 5
            }}
        />
    );
};

export default JellyCanvas;
