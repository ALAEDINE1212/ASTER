// Wait until all assets load
window.addEventListener('load', () => {
  const loader      = document.getElementById('loader');
  const logo        = document.getElementById('logo');
  const starCanvas  = document.getElementById('starfield');
  const boltCanvas  = document.getElementById('lightning-canvas');
  const sctx        = starCanvas.getContext('2d');
  const bctx        = boltCanvas.getContext('2d');
  let w = starCanvas.width  = boltCanvas.width  = window.innerWidth;
  let h = starCanvas.height = boltCanvas.height = window.innerHeight;

  // Starfield
  const stars = Array.from({ length: 800 }, () => ({ x: Math.random()*w, y: Math.random()*h, z: Math.random()*w }));
  function drawStars() {
    sctx.fillStyle = '#000'; sctx.fillRect(0,0,w,h);
    sctx.fillStyle = '#fff';
    stars.forEach(star => {
      star.z -= 2;
      if (star.z <= 0) star.x= Math.random()*w, star.y= Math.random()*h, star.z = w;
      const k = 128.0 / star.z;
      const px = (star.x - w/2)*k + w/2;
      const py = (star.y - h/2)*k + h/2;
      const size = (1 - star.z/w)*3;
      sctx.beginPath(); sctx.arc(px, py, size, 0, Math.PI*2); sctx.fill();
    });
    requestAnimationFrame(drawStars);
  }

  // Fractal lightning
  function drawBolt(x1,y1,x2,y2,displace){
    if(displace < 2){
      bctx.beginPath(); bctx.moveTo(x1,y1); bctx.lineTo(x2,y2); bctx.stroke();
    } else {
      const midX = (x1+x2)/2 + (Math.random()-0.5)*displace;
      const midY = (y1+y2)/2 + (Math.random()-0.5)*displace;
      drawBolt(x1,y1,midX,midY,displace/2);
      drawBolt(x2,y2,midX,midY,displace/2);
    }
  }
  function strike() {
    bctx.clearRect(0,0,w,h);
    bctx.strokeStyle = 'rgba(255,255,255,0.9)';
    bctx.lineWidth   = 2;
    const startX = Math.random()*w*0.8 + w*0.1;
    const endX   = w/2;
    const endY   = h/2;
    drawBolt(startX,0,endX,endY,150);
  }

  function playIntro() {
    strike();
    boltCanvas.style.opacity = 1;
    setTimeout(() => {
      boltCanvas.style.transition = 'opacity 0.4s ease-out';
      boltCanvas.style.opacity = 0;
      logo.style.opacity = 1;
      logo.style.transform = 'scale(1)';
    }, 200);
  }

  // Start
  drawStars();
  setTimeout(playIntro, 800);
  setTimeout(() => loader.style.display = 'none', 3000);

  // Resize
  window.addEventListener('resize', () => {
    w = starCanvas.width = boltCanvas.width = window.innerWidth;
    h = starCanvas.height = boltCanvas.height = window.innerHeight;
  });
});