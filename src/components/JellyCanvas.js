import React, { useRef, useEffect } from 'react';

const JellyCanvas = ({ isLightMode, expanded }) => {
    const canvasRef = useRef(null);

    // ==========================================
    // 🔧 TWEAKING VALUES
    // ==========================================
    // Track animated height across renders without re-triggering effect if not needed
    // However, since we want the effect to respond to `expanded`, we can put the logic inside.
    const currentNavHeightRef = useRef(85);
    const expandedRef = useRef(expanded);

    useEffect(() => {
        expandedRef.current = expanded;
    }, [expanded]);

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
        let baseNavHeight = 85;
        let tailThickness = 200;
        let tailLength = 200;
        let volumeRadius = 200;
        let volumeForce = 0.55;
        const navX = 15;
        const navY = 15;
        const cornerRadius = 25; // Could scale this too if needed
        const expandedHeight = 250; // Increased height to cover menu fully

        const initPoints = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;

            // RESPONSIVE LOGIC
            // Match Bootstrap 'lg' breakpoint (992px)
            if (width < 992) {
                baseNavHeight = 85;
                tailThickness = 120;
                volumeRadius = 120;
                tailLength = 100;
                // Mobile physics (Original)
                config.bottom = { spring: 0.06, friction: 0.81, drag: 0.35 };
            } else {
                baseNavHeight = 85;
                tailThickness = 200;
                volumeRadius = 200;
                tailLength = 200;
                volumeForce = 0.55; // RESTORED: Auto-Reset handles the glitch now.

                // DESKTOP LOGIC
                if (isLightMode) {
                    // [LIGHT MODE PATCH]
                    // MAXIMIZED TAIL: Very loose spring + Very high drag
                    config.bottom = { spring: 0.05, friction: 0.81, drag: 0.85 };
                    config.top = { spring: 0.1, friction: 0.8, drag: 0.1 };
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

            // Use current animated height for initial setup to avoid snapping if resized while expanded
            // But usually resize resets everything. Let's use currentNavHeightRef if meaningful, or base.
            // Actually, if we resize, we probably want to reset to base state or current target?
            // Let's use baseNavHeight for simplicity during resize re-init, or rely on animation loop to fix it.
            // Using baseNavHeight ensures ratios are calculated against the "closed" state (or we calculate against expanded).
            // Logic: Calculate ratios based on CURRENT target state? 
            // Better: Calculate ratios based on the conceptual "0 to 1" span.

            const h = currentNavHeightRef.current; // Use current animated height to prevent jumping

            // 1. TOP
            sides.top = fill(navX + cornerRadius, navX + totalWidth - cornerRadius, navY, 0, navY);
            sides.top.forEach(p => { p.ox = p.x; p.oy = navY; });
            sides.top.push({ x: navX + totalWidth - cornerRadius, y: navY, ox: navX + totalWidth - cornerRadius, oy: navY, vx: 0, vy: 0 });

            // 2. RIGHT
            const rightX = navX + totalWidth;
            sides.right = [];
            // We generate points covering the current height
            for (let y = navY + cornerRadius; y <= navY + h - cornerRadius; y += gap) {
                // Calculate normalized ratio (0 at top, 1 at bottom)
                // Note: h is the total height of the nav area.
                // y goes from navY to navY + h.
                // relative Y = y - navY.
                const ratio = (y - navY) / Math.max(h, 1);
                sides.right.push({ x: rightX, y, ox: rightX, oy: y, vx: 0, vy: 0, ratio: ratio });
            }
            sides.right.push({ x: rightX, y: navY + h - cornerRadius, ox: rightX, oy: navY + h - cornerRadius, vx: 0, vy: 0, isCorner: true });

            // 3. BOTTOM
            sides.bottom = fill(navX + cornerRadius, navX + totalWidth - cornerRadius, navY + h, 0, navY + h);
            sides.bottom.forEach(p => { p.ox = p.x; p.oy = navY + h; });
            sides.bottom.push({ x: navX + totalWidth - cornerRadius, y: navY + h, ox: navX + totalWidth - cornerRadius, oy: navY + h, vx: 0, vy: 0 });

            // 4. LEFT
            const leftX = navX;
            sides.left = [];
            for (let y = navY + cornerRadius; y <= navY + h - cornerRadius; y += gap) {
                const ratio = (y - navY) / Math.max(h, 1);
                sides.left.push({ x: leftX, y, ox: leftX, oy: y, vx: 0, vy: 0, ratio: ratio });
            }
            sides.left.push({ x: leftX, y: navY + h - cornerRadius, ox: leftX, oy: navY + h - cornerRadius, vx: 0, vy: 0, isCorner: true });
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

        // New: Event listener for custom event to toggle expanded state
        const handleToggleExpanded = (event) => {
            expandedRef.current = event.detail.expanded;
        };
        window.addEventListener('jellyCanvasToggleExpanded', handleToggleExpanded);

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

            // ANIMATE HEIGHT
            const isMobile = window.innerWidth < 992; // MATCH BOOTSTRAP LG BREAKPOINT
            const target = (isMobile && expandedRef.current) ? expandedHeight : baseNavHeight;
            const diff = target - currentNavHeightRef.current; // Use Ref current

            // Allow small delta to settle
            if (Math.abs(diff) > 0.5) {
                currentNavHeightRef.current += diff * 0.15; // Smooth lerp
                const h = currentNavHeightRef.current;

                // Update Origin Points (OY)

                // Bottom: Move to new Y
                sides.bottom.forEach(p => {
                    p.oy = navY + h;
                });

                // Sides: Stretch based on ratio
                sides.right.forEach(p => {
                    if (p.ratio !== undefined) {
                        p.oy = navY + (p.ratio * h);
                    } else if (p.isCorner) {
                        p.oy = navY + h - cornerRadius;
                    }
                });
                sides.left.forEach(p => {
                    if (p.ratio !== undefined) {
                        p.oy = navY + (p.ratio * h);
                    } else if (p.isCorner) {
                        p.oy = navY + h - cornerRadius;
                    }
                });
            }

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
            ctx.quadraticCurveTo(navX + (width - 30), navY + currentNavHeightRef.current, sides.bottom[sides.bottom.length - 1].x, sides.bottom[sides.bottom.length - 1].y);
            for (let i = sides.bottom.length - 2; i >= 0; i--) {
                const p = sides.bottom[i];
                const prev = sides.bottom[i + 1];
                const cx = (prev.x + p.x) / 2;
                const cy = (prev.y + p.y) / 2;
                ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
            }

            // Bottom Left Corner & Left Side (Reverse)
            ctx.quadraticCurveTo(navX, navY + currentNavHeightRef.current, sides.left[sides.left.length - 1].x, sides.left[sides.left.length - 1].y);
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
    }, [isLightMode]);

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
