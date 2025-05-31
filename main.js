// Firebase Imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

// Firebase Configuration
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

// Load and display products
function loadProducts() {
  const productsRef = ref(database, 'products');
  onValue(productsRef, snapshot => {
    const data = snapshot.val();
    renderProducts(data);
  });
}

function renderProducts(products) {
  const productContainer = document.getElementById('productList');
  productContainer.innerHTML = '';
  
  if (!products) {
    productContainer.innerHTML = '<p>No products available.</p>';
    return;
  }

  Object.keys(products).forEach(key => {
    const { name, description, price, imageUrl } = products[key];
    const card = document.createElement('div');
    card.classList.add('product-card');
    
    card.innerHTML = `
      <img src="${imageUrl}" alt="${name}">
      <h3>${name}</h3>
      <p>${description}</p>
      <div class="price">$${parseFloat(price).toFixed(2)}</div>
      <button onclick="handleBuy('${key}', '${name}')">Buy Now</button>
    `;
    
    productContainer.appendChild(card);
  });
}

// Initialize
window.addEventListener('DOMContentLoaded', loadProducts);

// Make handleBuy available globally
window.handleBuy = function(productId, productName) {
  const email = prompt(`Enter your email to order "${productName}":`);
  if (!email) return;

  const ordersRef = ref(database, 'orders');
  push(ordersRef, {
    productId,
    email,
    timestamp: Date.now()
  })
    .then(() => alert('Thank you! Your order has been placed.'))
    .catch(err => {
      console.error('Error placing order:', err);
      alert('Failed to place order. Please try again later.');
    });
};