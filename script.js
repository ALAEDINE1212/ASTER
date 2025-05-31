// === STARFIELD + LIGHTNING + NEBULA PARALLAX + FIREBASE LOGIC ===

// 1) STARFIELD + SVG LIGHTNING INTRO
window.addEventListener('load', () => {
  const loader    = document.getElementById('loader');
  const introLogo = document.getElementById('intro-logo');
  const sC        = document.getElementById('starfield');
  const svg       = document.getElementById('lightning-svg');
  const flash     = document.getElementById('flash');
  const nebula    = document.querySelector('.nebula');
  const sCtx      = sC.getContext('2d');
  let w = sC.width  = window.innerWidth;
  let h = sC.height = window.innerHeight;
  let starAnimId;

  // 1a) Draw starfield (simple 3D zoom effect)
  const stars = Array.from({ length: 600 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    z: Math.random() * w
  }));
  function drawStars() {
    sCtx.fillStyle = '#000';
    sCtx.fillRect(0, 0, w, h);
    sCtx.fillStyle = '#fff';
    stars.forEach(s => {
      s.z -= 2;
      if (s.z <= 0) {
        s.x = Math.random() * w;
        s.y = Math.random() * h;
        s.z = w;
      }
      const k  = 128 / s.z;
      const px = (s.x - w / 2) * k + w / 2;
      const py = (s.y - h / 2) * k + h / 2;
      const sz = (1 - s.z / w) * 3;
      sCtx.beginPath();
      sCtx.arc(px, py, sz, 0, 2 * Math.PI);
      sCtx.fill();
    });
    starAnimId = requestAnimationFrame(drawStars);
  }

  // 1b) Build a fractal lightning bolt (multilayer for depth)
  function makeBolt(x1, y1, x2, y2, disp) {
    if (disp < 1) return [[x1, y1], [x2, y2]];
    const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * disp;
    const my = (y1 + y2) / 2 + (Math.random() - 0.5) * disp;
    const left  = makeBolt(x1, y1, mx, my, disp / 2);
    const right = makeBolt(mx, my, x2, y2, disp / 2);
    return [...left, ...right.slice(1)];
  }
  function drawBolts() {
    svg.innerHTML = '';
    const layers = [
      { disp: 30, stroke: 2.0, opacity: 0.8 },
      { disp: 15, stroke: 1.2, opacity: 0.6 },
      { disp: 6,  stroke: 0.7, opacity: 0.4 }
    ];
    layers.forEach(l => {
      const pts = makeBolt(
        10 + Math.random() * 80, 0,     // random top‐edge start
        50, 50,                        // center target for the logo
        l.disp
      );
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      poly.setAttribute('points', pts.map(p => p.join(',')).join(' '));
      poly.setAttribute('stroke', '#fff');
      poly.setAttribute('stroke-width', l.stroke);
      poly.setAttribute('fill', 'none');
      poly.setAttribute('opacity', l.opacity);
      svg.appendChild(poly);
      const L = poly.getTotalLength();
      poly.style.strokeDasharray  = L;
      poly.style.strokeDashoffset = L;
      poly.style.transition        = 'stroke-dashoffset 0.25s ease-out';
      requestAnimationFrame(() => poly.style.strokeDashoffset = '0');
    });
  }

  // 1c) Parallax effect on nebula
  function initParallax() {
    window.addEventListener('mousemove', e => {
      const px = (e.clientX / window.innerWidth  - 0.5) * 20;
      const py = (e.clientY / window.innerHeight - 0.5) * 20;
      nebula.style.transform = `translate(${px}px, ${py}px)`;
    });
  }

  // 1d) Play the intro: draw lightning, flash, shake, reveal logo, hide loader
  function playIntro() {
    drawBolts();
    setTimeout(() => {
      flash.style.transition = 'opacity 0.1s ease-in';
      flash.style.opacity    = 1;
      loader.style.animation = 'shake 0.4s';
      setTimeout(() => { flash.style.opacity = 0; }, 100);
    }, 300);
    setTimeout(() => {
      introLogo.style.opacity   = 1;
      introLogo.style.transform = 'scale(1)';
    }, 450);
    setTimeout(() => {
      cancelAnimationFrame(starAnimId);
      loader.style.opacity = 0;
      setTimeout(() => {
        loader.style.display = 'none';
        initParallax();
      }, 500);
    }, 2000);
  }

  drawStars();           // start starfield loop
  setTimeout(playIntro, 800); // begin intro after slight delay

  // 1e) Handle window resize for starfield
  window.addEventListener('resize', () => {
    w = sC.width  = window.innerWidth;
    h = sC.height = window.innerHeight;
  });
});

// === 2) FIREBASE COMPAT LOGIC ===
//   (Requires Realtime Database rules and Storage CORS configured as described)

// Initialize Firebase (make sure your bucket exactly matches in the console)
firebase.initializeApp({
  apiKey: "AIzaSyA2HkqA6nONPzhxbcrLuuqKmeVIdVRYNHM",
  authDomain: "aster-7523e.firebaseapp.com",
  projectId: "aster-7523e",
  storageBucket: "aster-7523e.appspot.com",
  messagingSenderId: "175960778042",
  appId: "1:175960778042:web:6f3f0051c25a8cecaadc03",
  measurementId: "G-NDSZZX3H1G",
  databaseURL: "https://aster-7523e-default-rtdb.firebaseio.com"
});

// References
const auth    = firebase.auth();
const db      = firebase.database();
const storage = firebase.storage();

// UI references
const loginBtn    = document.getElementById('login-btn');
const loginModal  = document.getElementById('login-modal');
const loginSubmit = document.getElementById('login-submit');
const loginCancel = document.getElementById('login-cancel');
const logoutBtn   = document.getElementById('logout-btn');
const adminPanel  = document.getElementById('admin-panel');
const productForm = document.getElementById('product-form');
const ordersList  = document.getElementById('orders-list');
const productGrid = document.getElementById('product-grid');
let productsData  = {};

// 2a) Show/hide login modal
loginBtn.addEventListener('click', () => loginModal.classList.add('active'));
loginCancel.addEventListener('click', () => loginModal.classList.remove('active'));

// 2b) Sign in admin
loginSubmit.addEventListener('click', () => {
  const email = document.getElementById('admin-email').value;
  const pw    = document.getElementById('admin-password').value;
  auth.signInWithEmailAndPassword(email, pw)
    .then(() => loginModal.classList.remove('active'))
    .catch(e => alert('Login failed: ' + e.message));
});

// 2c) Sign out
logoutBtn.addEventListener('click', () => auth.signOut());

// 2d) React to auth state changes
auth.onAuthStateChanged(user => {
  if (user) {
    loginBtn.style.display   = 'none';
    adminPanel.style.display = 'block';
  } else {
    loginBtn.style.display   = 'inline-block';
    adminPanel.style.display = 'none';
  }
});

// 2e) Add a new product (upload image first to Storage)
productForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!auth.currentUser) {
    return alert('🚫 Please log in as admin first.');
  }
  const title = document.getElementById('product-title').value;
  const price = document.getElementById('product-price').value;
  const file  = document.getElementById('product-image-file').files[0];
  if (!file) {
    return alert('Please select an image.');
  }

  const path     = `product_images/${Date.now()}_${file.name}`;
  const storeRef = storage.ref(path);
  storeRef.put(file)
    .then(snap => snap.ref.getDownloadURL())
    .then(url => {
      return db.ref('products').push({
        title,
        price,
        imageUrl: url
      });
    })
    .then(() => {
      productForm.reset();
      alert('✅ Product added!');
    })
    .catch(err => alert('❌ Error: ' + err.message));
});

// 2f) Load & display products
db.ref('products').on('value', snap => {
  productsData = snap.val() || {};
  productGrid.innerHTML = '';
  Object.entries(productsData).forEach(([id, p]) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${p.imageUrl}" alt="${p.title}">
      <div class="product-info">
        <h3>${p.title}</h3>
        <p class="price">$${parseFloat(p.price).toFixed(2)}</p>
        <button class="buy-btn" data-id="${id}">Buy Now</button>
      </div>
    `;
    productGrid.appendChild(card);
  });

  // Wire “Buy Now” buttons
  document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.onclick = () => {
      const id   = btn.dataset.id;
      const prod = productsData[id];
      db.ref('orders').push({
        productId: id,
        product: prod,
        timestamp: Date.now()
      });
      alert('✅ Order placed!');
    };
  });
});

// 2g) Load & display orders
db.ref('orders').on('value', snap => {
  const orders = snap.val() || {};
  ordersList.innerHTML = '';
  Object.entries(orders).forEach(([oid, o]) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <strong>Order ID:</strong> ${oid}<br>
      <strong>Product:</strong> ${o.product.title} ($${o.product.price})<hr>
    `;
    ordersList.appendChild(div);
  });
});
