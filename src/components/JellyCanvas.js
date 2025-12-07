import React, { useRef, useEffect } from 'react';

const JellyCanvas = () => {
    const canvasRef = useRef(null);

    // ==========================================
    // 🔧 TWEAKING VALUES
    // ==========================================
    const tailLength = 200;    // Max distance the gel can stretch (Soft Limit)
    const tailThickness = 200; // Interaction Radius (How wide the pull is)

    const config = {
        // TOP: Very stable, pinned.
        top: { spring: 0.1, friction: 0.8, drag: 0.05 },
        right: { spring: 0.1, friction: 0.8, drag: 0.2 },
        left: { spring: 0.1, friction: 0.8, drag: 0.2 },
        // BOTTOM: Loose but heavy ripples.
        bottom: { spring: 0.06, friction: 0.81, drag: 0.35 }
    };

    // Repulsion / "Volume" Settings
    const volumeRadius = 200; // Radius of static bulge (cursor volume)
    const volumeForce = 0.55;  // Strength of displacement when still

    // Visual Settings
    const navX = 15;
    const navY = 15;
    const navHeight = 85;
    const cornerRadius = 25;
    // ==========================================

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const sides = { top: [], right: [], bottom: [], left: [] };
        let width, height;

        const initPoints = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;

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
            // Fix ox:
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
        const handleMouseMove = (e) => {
            mouse.lastX = mouse.x;
            mouse.lastY = mouse.y;
            mouse.x = e.clientX;
            mouse.y = e.clientY;

            // Limit Velocity (Anti-Glitch)
            const rawVx = e.clientX - mouse.lastX;
            const rawVy = e.clientY - mouse.lastY;
            const speedLimit = 35; // Clamp per frame speed
            mouse.vx = Math.max(Math.min(rawVx, speedLimit), -speedLimit);
            mouse.vy = Math.max(Math.min(rawVy, speedLimit), -speedLimit);
        };

        initPoints();
        window.addEventListener('resize', initPoints);
        window.addEventListener('mousemove', handleMouseMove);

        const updateSidePhysics = (points, settings, sideName) => {
            points.forEach(p => {
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);

                // 1. Static Volume Displacement (Bulge based on proximity)
                if (dist < volumeRadius) {
                    const norm = dist / volumeRadius;
                    // Push OUT from cursor center
                    const volC = Math.pow(1 - norm, 2) * volumeForce;

                    // Simply displace position (volume occupies space)
                    // or add force? Force is more stable for physics
                    p.vx += Math.cos(angle) * volC * 2;
                    p.vy += Math.sin(angle) * volC * 2;
                }

                // 2. Dynamic Drag (Asymmetrical)
                if (dist < tailThickness) {
                    const norm = dist / tailThickness;
                    const influence = Math.pow(1 - norm, 2);

                    if (Math.abs(mouse.vx) > 0.1 || Math.abs(mouse.vy) > 0.1) {
                        let forceX = mouse.vx * settings.drag * influence;
                        let forceY = mouse.vy * settings.drag * influence;

                        // [ASYMMETRY LOGIC]
                        // Direction check: Are we pushing "IN" to the gel?
                        // For bottom edge: Pushing UP (vy < 0) is pushing IN (compression).
                        // For Top edge: Pushing DOWN (vy > 0) is pushing IN.

                        let isPushingIn = false;
                        if (sideName === 'bottom' && mouse.vy < 0) isPushingIn = true;
                        if (sideName === 'top' && mouse.vy > 0) isPushingIn = true;

                        // If checking X sides, similar logic (left side, right vel = in)
                        if (sideName === 'left' && mouse.vx > 0) isPushingIn = true;
                        if (sideName === 'right' && mouse.vx < 0) isPushingIn = true;

                        if (isPushingIn) {
                            // Weak Push
                            forceX *= 0.1;
                            forceY *= 0.1;
                        } else {
                            // Strong Pull (Normal)
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

                // 4. Soft Constraints (Prevent Inside-Out)
                // If it goes "into" the box too much, strong repel.
                // Box bounds: navX, navY, w, h
                const centerX = navX + width / 2; // rough
                // Let's rely on Origin displacement logic
                const dOx = p.x - p.ox;
                const dOy = p.y - p.oy;
                const disp = Math.sqrt(dOx * dOx + dOy * dOy);

                // Soft Limit (Tail Length)
                if (disp > tailLength) {
                    const excess = disp - tailLength;
                    const limitForce = excess * 0.15; // Elastic limit
                    const returnAngle = Math.atan2(dOy, dOx);
                    p.vx -= Math.cos(returnAngle) * limitForce;
                    p.vy -= Math.sin(returnAngle) * limitForce;
                }

                // Anti-Compression (Inside Out)
                // If Bottom point goes ABOVE its origin (y < oy), it's compressing.
                // Allow small compression, but resist strongly.
                if (sideName === 'bottom' && p.y < p.oy - 15) {
                    p.vy += 0.5; // Push down hard
                }
                if (sideName === 'top' && p.y > p.oy + 15) {
                    p.vy -= 0.5; // Push up hard
                }

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

            // Standard smooth drawing
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
            // Corners etc..
            // Top Right
            ctx.quadraticCurveTo(
                navX + (width - 30), navY,
                sides.right[0].x, sides.right[0].y
            );
            // Right Side
            for (let i = 1; i < sides.right.length; i++) {
                const p = sides.right[i];
                const prev = sides.right[i - 1];
                const cx = (prev.x + p.x) / 2;
                const cy = (prev.y + p.y) / 2;
                ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
            }
            // Bottom Right
            ctx.quadraticCurveTo(
                navX + (width - 30), navY + navHeight,
                sides.bottom[sides.bottom.length - 1].x, sides.bottom[sides.bottom.length - 1].y
            );
            // Bottom Side (Reverse)
            for (let i = sides.bottom.length - 2; i >= 0; i--) {
                const p = sides.bottom[i];
                const prev = sides.bottom[i + 1];
                const cx = (prev.x + p.x) / 2;
                const cy = (prev.y + p.y) / 2;
                ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
            }
            // Bottom Left
            ctx.quadraticCurveTo(
                navX, navY + navHeight,
                sides.left[sides.left.length - 1].x, sides.left[sides.left.length - 1].y
            );
            // Left Side (Reverse)
            for (let i = sides.left.length - 2; i >= 0; i--) {
                const p = sides.left[i];
                const prev = sides.left[i + 1];
                const cx = (prev.x + p.x) / 2;
                const cy = (prev.y + p.y) / 2;
                ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
            }
            // Top Left
            ctx.quadraticCurveTo(
                navX, navY,
                sides.top[0].x, sides.top[0].y
            );

            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            requestAnimationFrame(update);
        };

        animationFrameId = requestAnimationFrame(update);
        return () => {
            window.removeEventListener('resize', initPoints);
            window.removeEventListener('mousemove', handleMouseMove);
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
