// ------------------------------
// 1) IMPORT FIREBASE SDKS
// ------------------------------
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import {
  getDatabase,
  ref as dbRef,
  onValue,
  push,
  set,
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// ------------------------------
// 2) FIREBASE CONFIG & INITIALIZATION
// ------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyA2HkqA6nONPzhxbcrLuuqKmeVIdVRYNHM",
  authDomain: "aster-7523e.firebaseapp.com",
  databaseURL: "https://aster-7523e-default-rtdb.firebaseio.com",
  projectId: "aster-7523e",
  storageBucket: "aster-7523e.firebasestorage.app",
  messagingSenderId: "175960778042",
  appId: "1:175960778042:web:6f3f0051c25a8cecaadc03",
  measurementId: "G-NDSZZX3H1G"
};

// Initialize Firebase App & Database
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ------------------------------
// 3) INTRO ANIMATION (STARFIELD + SVG “AS” LIGHTNING)
// ------------------------------
const introCanvas    = document.getElementById('introCanvas');
const introLogo      = document.getElementById('introLogo');
const logoText       = document.getElementById('logoText');
const flashOverlay   = document.getElementById('flashOverlay');
const mainContent    = document.getElementById('mainContent');
const headerLogoText = document.querySelector('.site-logo');

let stars = [];

// Resize canvas to full viewport
function resizeCanvas() {
  introCanvas.width  = window.innerWidth;
  introCanvas.height = window.innerHeight;
  initStars();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const ctx = introCanvas.getContext('2d');

// STARFIELD SETUP
function initStars() {
  const numStars = 300;
  stars = [];
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * introCanvas.width,
      y: Math.random() * introCanvas.height,
      radius: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.6 + 0.2,
      alpha: Math.random() * 0.5 + 0.2
    });
  }
}

// ANIMATE STARFIELD (downward drift + twinkle)
function animateStars() {
  ctx.clearRect(0, 0, introCanvas.width, introCanvas.height);
  stars.forEach((star) => {
    // Twinkle
    star.alpha += (Math.random() - 0.5) * 0.02;
    if (star.alpha < 0.2) star.alpha = 0.2;
    if (star.alpha > 1) star.alpha = 1;

    // Move downward
    star.y += star.speed;
    if (star.y > introCanvas.height) {
      star.y = 0;
      star.x = Math.random() * introCanvas.width;
      star.radius = Math.random() * 1.5 + 0.3;
      star.speed = Math.random() * 0.6 + 0.2;
    }

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
    ctx.fill();
  });

  requestAnimationFrame(animateStars);
}

// RUN INTRO ANIMATION
function runIntroAnimation() {
  // 1) Create a GSAP timeline for the sequence
  const tl = gsap.timeline();

  // 1a) Draw “AS” (strokeDashoffset: 1200 → 0) over 1s
  tl.to(logoText, {
    strokeDashoffset: 0,
    duration: 1,
    ease: "power2.inOut"
  });

  // 1b) Flash the screen (lightning strike) immediately after drawing finishes
  tl.to(flashOverlay, {
    opacity: 1,
    duration: 0.08,
    ease: "power1.in",
    yoyo: true,
    repeat: 1
  });

  // 1c) After the flash, quickly flicker & glow the “AS” for 2s
  tl.to(logoText, {
    onStart: () => {
      logoText.style.animation = "logo-glow-flicker 2s ease-in-out";
    },
    duration: 0.1
  });

  // 1d) Hold for a moment, then fade out #intro over 1s
  tl.to('#intro', {
    opacity: 0,
    duration: 1,
    ease: "power2.out",
    delay: 1.4, // let the glow run briefly
    onComplete: () => {
      document.getElementById('intro').style.display = 'none';
      // Reveal main content
      document.body.style.overflow = 'auto';
      mainContent.classList.remove('hidden');
      gsap.to(mainContent, { opacity: 1, duration: 1 });
      // Finally, fade in & glow the header “ASTRE”
      gsap.to(headerLogoText, { opacity: 1, duration: 1, onComplete: () => {
        headerLogoText.style.animation = "header-glow 3s ease-in-out infinite";
      }});
    }
  });
}

// ------------------------------
// 4) LOAD PRODUCTS & RENDER
// ------------------------------
const productsContainer = document.getElementById('product-list');

function loadAndRenderProducts() {
  const productsRef = dbRef(database, 'products');
  onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    renderProductCards(data);
  });
}

function renderProductCards(products) {
  productsContainer.innerHTML = ''; // clear existing

  if (!products) {
    productsContainer.innerHTML =
      '<p style="color:#777; text-align:center;">No products available.</p>';
    return;
  }

  Object.keys(products).forEach((key) => {
    const { name, description, price, imageUrl } = products[key];

    // Create card
    const card = document.createElement('div');
    card.classList.add('product-card');

    // Image
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = name;
    card.appendChild(img);

    // Name
    const title = document.createElement('h3');
    title.textContent = name;
    card.appendChild(title);

    // Description
    const desc = document.createElement('p');
    desc.textContent = description;
    card.appendChild(desc);

    // Price
    const priceEl = document.createElement('div');
    priceEl.classList.add('price');
    priceEl.textContent = `$${parseFloat(price).toFixed(2)}`;
    card.appendChild(priceEl);

    // Buy Button
    const buyBtn = document.createElement('button');
    buyBtn.classList.add('buy-btn');
    buyBtn.textContent = 'Buy Now';
    buyBtn.addEventListener('click', () => handleBuyClick(key, name));
    card.appendChild(buyBtn);

    productsContainer.appendChild(card);
  });
}

function handleBuyClick(productId, productName) {
  const email = prompt(`Enter your email to order "${productName}":`);
  if (!email) return;

  const ordersRef = dbRef(database, 'orders');
  const newOrderRef = push(ordersRef);
  set(newOrderRef, {
    productId,
    email,
    timestamp: Date.now(),
  })
    .then(() => {
      alert('Thank you! Your order has been placed.');
    })
    .catch((err) => {
      console.error('Error placing order:', err);
      alert('Failed to place order. Please try again later.');
    });
}

// ------------------------------
// 5) ONCE DOM CONTENT IS LOADED
// ------------------------------
window.addEventListener('DOMContentLoaded', () => {
  // 1) Start the starfield
  initStars();
  animateStars();

  // 2) Run the intro animation
  runIntroAnimation();

  // 3) After intro fully finishes (~4.5s + fade), load products
  setTimeout(() => {
    loadAndRenderProducts();
  }, 5500);
});
