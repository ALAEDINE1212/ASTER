// ------------------------------
// 1) IMPORT & INITIALIZE FIREBASE
// ------------------------------
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import {
  getDatabase,
  ref as dbRef,
  onValue,
  push,
  set
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Your Firebase project’s config (from the snippet you provided)
const firebaseConfig = {
  apiKey: "AIzaSyDx0t5M9QRPQoRBaMDtDUmGICCX8r_k2nw",
  authDomain: "astre-f93d3.firebaseapp.com",
  databaseURL: "https://astre-f93d3-default-rtdb.firebaseio.com",
  projectId: "astre-f93d3",
  storageBucket: "astre-f93d3.firebasestorage.app",
  messagingSenderId: "175273255912",
  appId: "1:175273255912:web:f2da15b4b4a32064a3fa5d",
  measurementId: "G-5X6K01L2Z0"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ------------------------------
// 2) STARFIELD SETUP
// ------------------------------
const starCanvas = document.getElementById('starfield');
const starCtx = starCanvas.getContext('2d');
let stars = [];

// Resize canvas to fill screen
function resizeCanvas() {
  starCanvas.width = window.innerWidth;
  starCanvas.height = window.innerHeight;
  initStars();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Initialize twinkling stars
function initStars() {
  stars = [];
  const numStars = 300;
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * starCanvas.width,
      y: Math.random() * starCanvas.height,
      radius: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.6 + 0.2,
      alpha: Math.random() * 0.5 + 0.2
    });
  }
}

function animateStars() {
  starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
  stars.forEach(star => {
    star.alpha += (Math.random() - 0.5) * 0.02;
    if (star.alpha < 0.2) star.alpha = 0.2;
    if (star.alpha > 1) star.alpha = 1;

    star.y += star.speed;
    if (star.y > starCanvas.height) {
      star.y = 0;
      star.x = Math.random() * starCanvas.width;
      star.radius = Math.random() * 1.5 + 0.3;
      star.speed = Math.random() * 0.6 + 0.2;
    }

    starCtx.beginPath();
    starCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    starCtx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
    starCtx.fill();
  });

  requestAnimationFrame(animateStars);
}

// Start the starfield animation
initStars();
animateStars();

// ------------------------------
// 3) RUN “AS” INTRO ANIMATION
// ------------------------------
const logoText = document.getElementById('logoText');
const flashScreen = document.getElementById('flashScreen');
const introContainer = document.getElementById('introContainer');
const mainContent = document.getElementById('mainContent');
const headerLogo = document.querySelector('.site-logo');

function runIntro() {
  const tl = gsap.timeline();

  // 1) Draw the SVG stroke (dashoffset: 1000 → 0)
  tl.to(logoText, {
    strokeDashoffset: 0,
    duration: 1,
    ease: 'power2.inOut'
  });

  // 2) Flash like lightning
  tl.to(flashScreen, {
    opacity: 1,
    duration: 0.08,
    ease: 'power1.in',
    yoyo: true,
    repeat: 1
  });

  // 3) Slight flicker/glow
  tl.to(logoText, {
    onStart: () => {
      logoText.style.animation = 'as-flicker 2s ease-in-out';
    },
    duration: 0.1
  });

  // 4) Fade out intro, reveal main content
  tl.to(introContainer, {
    opacity: 0,
    duration: 1,
    ease: 'power2.out',
    delay: 1.4,
    onComplete: () => {
      introContainer.style.display = 'none';
      document.body.style.overflow = 'auto';
      mainContent.classList.remove('hidden');
      gsap.to(mainContent, { opacity: 1, duration: 1 });
      // Fade in & glow the header logo
      gsap.to(headerLogo, {
        opacity: 1,
        duration: 1,
        onComplete: () => {
          headerLogo.style.animation = 'header-glow 3s ease-in-out infinite';
        }
      });
    }
  });
}

// ------------------------------
// 4) LOAD & DISPLAY PRODUCTS
// ------------------------------
const productContainer = document.getElementById('productList');

function loadProducts() {
  const productsRef = dbRef(database, 'products');
  onValue(productsRef, snapshot => {
    const data = snapshot.val();
    renderProducts(data);
  });
}

function renderProducts(products) {
  productContainer.innerHTML = '';
  if (!products) {
    productContainer.innerHTML =
      '<p style="color:#777; text-align:center;">No products available.</p>';
    return;
  }

  Object.keys(products).forEach(key => {
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
    buyBtn.addEventListener('click', () =>
      handleBuy(key, name)
    );
    card.appendChild(buyBtn);

    productContainer.appendChild(card);
  });
}

function handleBuy(productId, productName) {
  const email = prompt(`Enter your email to order "${productName}":`);
  if (!email) return;

  const ordersRef = dbRef(database, 'orders');
  const newOrderRef = push(ordersRef);
  set(newOrderRef, {
    productId,
    email,
    timestamp: Date.now()
  })
    .then(() => {
      alert('Thank you! Your order has been placed.');
    })
    .catch(err => {
      console.error('Error placing order:', err);
      alert('Failed to place order. Please try again later.');
    });
}

// ------------------------------
// 5) ONCE DOM CONTENT LOADED
// ------------------------------
window.addEventListener('DOMContentLoaded', () => {
  // Run intro, then load products after a short delay
  runIntro();
  setTimeout(loadProducts, 5000); // give time for intro (~5s)
});
