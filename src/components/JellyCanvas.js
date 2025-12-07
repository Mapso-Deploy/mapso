import React, { useRef, useEffect } from 'react';

const JellyCanvas = () => {
    const canvasRef = useRef(null);

    // ==========================================
    // 🔧 TWEAKING VALUES
    // ==========================================
    // Physics Configuration per side
    // High Friction = Thicker/Heavier Gel.
    // Low Spring = Loose, ripples more slowly.
    const config = {
        // TOP: Very stable, barely moves, no jitter.
        top: { spring: 0.1, friction: 0.6, drag: 0.2 },

        // SIDES: Moderate
        right: { spring: 0.1, friction: 0.8, drag: 0.2 },
        left: { spring: 0.1, friction: 0.8, drag: 0.2 },

        // BOTTOM: The main "Jelly". Loose but heavy.
        bottom: { spring: 0.04, friction: 0.8, drag: 0.4 }
    };

    const softLimit = 150;    // interaction slows down past this
    const hardLimit = 205;   // almost impossible to pass this

    // Interaction Settings
    const interactionRadius = 180;
    const bubbleRadius = 155;
    const bubbleStrength = 0.1;

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
            const gap = 5; // Slightly fewer points for better performance/stability

            // --- INITIALIZE POINTS ---
            // Note: points store their "Origin" (ox, oy)

            // 1. TOP (L->R)
            const topStartX = navX + cornerRadius;
            const topEndX = navX + totalWidth - cornerRadius;
            sides.top = [];
            for (let x = topStartX; x <= topEndX; x += gap) {
                sides.top.push({ x, y: navY, ox: x, oy: navY, vx: 0, vy: 0 });
            }
            sides.top.push({ x: topEndX, y: navY, ox: topEndX, oy: navY, vx: 0, vy: 0 }); // Anchor end

            // 2. RIGHT (T->B)
            const rightStartY = navY + cornerRadius;
            const rightEndY = navY + navHeight - cornerRadius;
            const rightX = navX + totalWidth;
            sides.right = [];
            for (let y = rightStartY; y <= rightEndY; y += gap) {
                sides.right.push({ x: rightX, y, ox: rightX, oy: y, vx: 0, vy: 0 });
            }
            sides.right.push({ x: rightX, y: rightEndY, ox: rightX, oy: rightEndY, vx: 0, vy: 0 });

            // 3. BOTTOM (L->R) - Stored L->R for index simplicity, drawn R->L
            sides.bottom = [];
            for (let x = topStartX; x <= topEndX; x += gap) {
                sides.bottom.push({ x, y: navY + navHeight, ox: x, oy: navY + navHeight, vx: 0, vy: 0 });
            }
            sides.bottom.push({ x: topEndX, y: navY + navHeight, ox: topEndX, oy: navY + navHeight, vx: 0, vy: 0 });

            // 4. LEFT (T->B)
            sides.left = [];
            const leftX = navX;
            for (let y = rightStartY; y <= rightEndY; y += gap) {
                sides.left.push({ x: leftX, y, ox: leftX, oy: y, vx: 0, vy: 0 });
            }
            sides.left.push({ x: leftX, y: rightEndY, ox: leftX, oy: rightEndY, vx: 0, vy: 0 });
        };

        initPoints();
        window.addEventListener('resize', initPoints);

        const mouse = { x: -1000, y: -1000, vx: 0, vy: 0, lastX: -1000, lastY: -1000 };
        const handleMouseMove = (e) => {
            mouse.lastX = mouse.x;
            mouse.lastY = mouse.y;
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            mouse.vx = mouse.x - mouse.lastX;
            mouse.vy = mouse.y - mouse.lastY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        const updateSidePhysics = (points, settings) => {
            points.forEach(p => {
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // 1. Soft Bubble Repulsion (Padding)
                if (dist < bubbleRadius) {
                    const norm = dist / bubbleRadius;
                    const repulse = Math.pow(1 - norm, 2) * bubbleStrength;
                    const angle = Math.atan2(dy, dx);
                    p.vx += Math.cos(angle) * repulse * 5; // Reduced multiplier for stability
                    p.vy += Math.sin(angle) * repulse * 5;
                }

                // 2. Drag / Pull
                // Only if outside bubble slightly? Overlap is okay.
                if (dist < interactionRadius) {
                    const norm = dist / interactionRadius;
                    const influence = Math.pow(1 - norm, 2);

                    if (Math.abs(mouse.vx) > 0.1 || Math.abs(mouse.vy) > 0.1) {
                        p.vx += mouse.vx * settings.drag * influence;
                        p.vy += mouse.vy * settings.drag * influence;
                    }
                }

                // 3. Spring back
                const ax = (p.ox - p.x) * settings.spring;
                const ay = (p.oy - p.y) * settings.spring;
                p.vx += ax;
                p.vy += ay;

                // 4. Soft Limit Constraint (Exponential Spring)
                const dOx = p.x - p.ox;
                const dOy = p.y - p.oy;
                const disp = Math.sqrt(dOx * dOx + dOy * dOy);

                if (disp > softLimit) {
                    // Calculate excess
                    const excess = disp - softLimit;
                    // Force grows exponentially
                    const limitForce = excess * 0.1; // gentle push back

                    // Apply opposite to displacement
                    const angle = Math.atan2(dOy, dOx);
                    p.vx -= Math.cos(angle) * limitForce;
                    p.vy -= Math.sin(angle) * limitForce;
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

            // Update all sides with their specific configs
            updateSidePhysics(sides.top, config.top);
            updateSidePhysics(sides.right, config.right);
            updateSidePhysics(sides.bottom, config.bottom);
            updateSidePhysics(sides.left, config.left);

            // Drawing Loop
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 10;

            ctx.beginPath();

            // 1. Start Top Left (First element of Top array)
            const firstTop = sides.top[0];
            ctx.moveTo(firstTop.x, firstTop.y);

            // Trace Top
            for (let i = 1; i < sides.top.length; i++) {
                const p = sides.top[i];
                const prev = sides.top[i - 1];
                const cx = (prev.x + p.x) / 2;
                const cy = (prev.y + p.y) / 2;
                ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
            }
            const lastTop = sides.top[sides.top.length - 1];

            // Corner Top-Right: Connect lastTop to firstRight
            // We use a quadratic curve that "pulls" towards the theoretical static corner
            // to keep the corner feeling somewhat grounded unless dragged heavily
            ctx.quadraticCurveTo(
                navX + (width - 30), navY, // Control: Static Top-Right Corner
                sides.right[0].x, sides.right[0].y
            );

            // Trace Right
            for (let i = 1; i < sides.right.length; i++) {
                const p = sides.right[i];
                const prev = sides.right[i - 1];
                const cx = (prev.x + p.x) / 2;
                const cy = (prev.y + p.y) / 2;
                ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
            }

            // Corner Bottom-Right
            ctx.quadraticCurveTo(
                navX + (width - 30), navY + navHeight, // Control: Static Bottom-Right
                sides.bottom[sides.bottom.length - 1].x, sides.bottom[sides.bottom.length - 1].y // Connect to END of bottom array
            );

            // Trace Bottom (Reverse)
            // Bottom array is stored L->R, so we iterate backwards
            for (let i = sides.bottom.length - 2; i >= 0; i--) {
                const p = sides.bottom[i];
                const prev = sides.bottom[i + 1]; // "Previous" in drawing order
                const cx = (prev.x + p.x) / 2;
                const cy = (prev.y + p.y) / 2;
                ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
            }

            // Corner Bottom-Left
            ctx.quadraticCurveTo(
                navX, navY + navHeight, // Control: Static Bottom-Left
                sides.left[sides.left.length - 1].x, sides.left[sides.left.length - 1].y // Connect to END of left array
            );

            // Trace Left (Reverse)
            // Left array is T->B, so iterate backwards to go B->T
            for (let i = sides.left.length - 2; i >= 0; i--) {
                const p = sides.left[i];
                const prev = sides.left[i + 1];
                const cx = (prev.x + p.x) / 2;
                const cy = (prev.y + p.y) / 2;
                ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
            }

            // Corner Top-Left
            // Connect start of Left to start of Top
            ctx.quadraticCurveTo(
                navX, navY, // Control: Static Top-Left
                firstTop.x, firstTop.y
            );

            ctx.closePath();
            ctx.fill();
            ctx.shadowColor = 'transparent';
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
