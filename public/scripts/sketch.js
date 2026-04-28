/* ══════════════════════════════════════════════════════════════════════
   p5.js SKETCH — reads window.JP_CONFIG every frame
══════════════════════════════════════════════════════════════════════ */
(function () {
    const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Internal blob state (positions tracked separately from config)
    let blobState = [];
    let t = 0;

    function drawBlob(x, y, r, color, alpha) {
        const ctx = drawingContext;
        const [cr, cg, cb] = color;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0.00, `rgba(${cr|0},${cg|0},${cb|0},${alpha.toFixed(3)})`);
        grad.addColorStop(0.35, `rgba(${cr|0},${cg|0},${cb|0},${(alpha*0.65).toFixed(3)})`);
        grad.addColorStop(0.65, `rgba(${cr|0},${cg|0},${cb|0},${(alpha*0.28).toFixed(3)})`);
        grad.addColorStop(1.00, `rgba(${cr|0},${cg|0},${cb|0},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    window.setup = function () {
        const c = createCanvas(windowWidth, windowHeight);
        c.id('bg-canvas');
        c.elt.setAttribute('aria-hidden', 'true');
        pixelDensity(Math.min(window.devicePixelRatio || 1, 1.5));

        const cfg = window.JP_CONFIG;
        blobState = cfg.blobs.map(b => ({ x: b.bx * width, y: b.by * height }));
        if (REDUCE) noLoop();
    };

    window.draw = function () {
        background(7, 10, 20);
        const cfg = window.JP_CONFIG;

        // Update blob positions via Perlin noise (reads current config each frame)
        cfg.blobs.forEach((b, i) => {
            blobState[i].x = lerp(width * 0.08, width * 0.92, noise(b.sx, t * b.sp));
            blobState[i].y = lerp(height * 0.08, height * 0.92, noise(b.sy, t * b.sp + 100));
        });

        // Draw blobs sorted large→small so smaller sit on top
        const order = cfg.blobs.map((b,i) => i).sort((a,b) => cfg.blobs[b].r - cfg.blobs[a].r);
        for (const i of order) {
            const b = cfg.blobs[i];
            drawBlob(blobState[i].x, blobState[i].y, b.r, b.c, b.alpha);
        }
        // Cursor orb — autonomous drift, no mouse tracking
        const cur = cfg.cursor;
        const cxPos = lerp(width * 0.08, width * 0.92, noise(cur.sx, t * cur.sp));
        const cyPos = lerp(height * 0.08, height * 0.92, noise(cur.sy, t * cur.sp + 100));
        drawBlob(cxPos, cyPos, cur.r, cur.c, cur.alpha);

        t += 0.004;
    };

    window.windowResized = function () {
        resizeCanvas(windowWidth, windowHeight);
        const cfg = window.JP_CONFIG;
        blobState = cfg.blobs.map((b,i) => blobState[i] ?? { x: b.bx * width, y: b.by * height });
    };
})();
