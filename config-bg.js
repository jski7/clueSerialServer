// Generative gradient background (aligned with big_cartel_pages/about.html)
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  let W = 0;
  let H = 0;
  let blobs;

  const COLORS = [
    [255, 160, 200],
    [160, 180, 255],
    [255, 220, 160],
    [180, 240, 200],
    [210, 170, 255],
  ];

  function initBlobs() {
    blobs = COLORS.map((rgb) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: W * (0.25 + Math.random() * 0.2),
      rgb,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));
  }

  function scaleBlobsTo(newW, newH) {
    if (W < 1 || H < 1 || !blobs || blobs.length !== COLORS.length) return false;
    const sx = newW / W;
    const sy = newH / H;
    const sR = Math.sqrt(sx * sy);
    for (const b of blobs) {
      b.x *= sx;
      b.y *= sy;
      b.r *= sR;
      b.x = Math.max(-b.r, Math.min(newW + b.r, b.x));
      b.y = Math.max(-b.r, Math.min(newH + b.r, b.y));
    }
    return true;
  }

  function applyResize() {
    const newW = window.innerWidth;
    const newH = window.innerHeight;
    if (newW < 1 || newH < 1) return;

    if (W < 1 || H < 1) {
      W = newW;
      H = newH;
      canvas.width = W;
      canvas.height = H;
      initBlobs();
      return;
    }

    if (newW === W && newH === H) return;

    scaleBlobsTo(newW, newH);
    W = newW;
    H = newH;
    canvas.width = W;
    canvas.height = H;
  }

  let resizeRaf = 0;
  function scheduleResize() {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(function () {
      resizeRaf = 0;
      applyResize();
    });
  }

  function draw() {
    if (W < 1 || H < 1 || !blobs) {
      requestAnimationFrame(draw);
      return;
    }
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, W, H);
    for (const b of blobs) {
      const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      grd.addColorStop(0, `rgba(${b.rgb[0]},${b.rgb[1]},${b.rgb[2]},0.38)`);
      grd.addColorStop(1, `rgba(${b.rgb[0]},${b.rgb[1]},${b.rgb[2]},0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      b.x += b.vx;
      b.y += b.vy;
      if (b.x < -b.r || b.x > W + b.r) b.vx *= -1;
      if (b.y < -b.r || b.y > H + b.r) b.vy *= -1;
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', scheduleResize);
  applyResize();
  draw();
})();
