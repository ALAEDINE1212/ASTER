// Firebase Imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import {
  getDatabase,
  ref as dbRef,
  onValue,
  push,
  set,
  remove
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

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
const auth = getAuth(app);
const database = getDatabase(app);

// DOM Elements
const loginWrapper = document.getElementById('loginWrapper');
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginButton = document.getElementById('loginButton');
const loginMessage = document.getElementById('loginMessage');
const dashboardSection = document.getElementById('dashboardSection');
const logoutBtn = document.getElementById('logoutBtn');
const addProductForm = document.getElementById('addProductForm');
const existingProductsList = document.getElementById('existingProductsList');
const ordersTableBody = document.querySelector('#ordersTable tbody');

// Show message function
function showMessage(message, type) {
  loginMessage.textContent = message;
  loginMessage.className = `login-message ${type}-message`;
  loginMessage.style.opacity = '1';
  
  // Clear message after 5 seconds
  setTimeout(() => {
    loginMessage.style.opacity = '0';
    setTimeout(() => {
      loginMessage.textContent = '';
      loginMessage.className = 'login-message';
    }, 300);
  }, 5000);
}

// Auth state observer
onAuthStateChanged(auth, (user) => {
  console.log("Auth state changed:", user ? "User logged in" : "No user");
  
  if (user) {
    loginWrapper.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
    loadExistingProducts();
    loadOrders();
    showMessage('Successfully logged in!', 'success');
  } else {
    loginWrapper.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    logoutBtn.classList.add('hidden');
    loginForm.reset();
  }
});

// Login form handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = loginEmail.value.trim();
  const password = loginPassword.value;
  
  if (!email || !password) {
    showMessage('Please enter both email and password.', 'error');
    return;
  }
  
  loginButton.disabled = true;
  loginButton.textContent = 'Logging in...';
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Login successful");
  } catch (error) {
    console.error("Login error:", error);
    showMessage(error.message, 'error');
    loginButton.disabled = false;
    loginButton.textContent = 'Login';
  }
});

// Logout handler
logoutBtn.addEventListener('click', async () => {
  try {
    await signOut(auth);
    showMessage('Logged out successfully', 'success');
  } catch (error) {
    console.error("Logout error:", error);
    showMessage('Error logging out', 'error');
  }
});

// Product management functions
function loadExistingProducts() {
  const productsRef = dbRef(database, 'products');
  onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    renderExistingProducts(data);
  });
}

function renderExistingProducts(products) {
  existingProductsList.innerHTML = '';
  if (!products) {
    existingProductsList.innerHTML = '<p class="no-products">No products found.</p>';
    return;
  }

  Object.keys(products).forEach((key) => {
    const { name, description, price, imageUrl } = products[key];
    const card = document.createElement('div');
    card.classList.add('product-card');
    
    card.innerHTML = `
      <img src="${imageUrl}" alt="${name}">
      <h3>${name}</h3>
      <p>${description}</p>
      <div class="price">$${parseFloat(price).toFixed(2)}</div>
      <button class="buy-btn delete-btn" data-id="${key}">Remove</button>
    `;
    
    card.querySelector('.delete-btn').addEventListener('click', () => removeProduct(key));
    existingProductsList.appendChild(card);
  });
}

async function removeProduct(productId) {
  if (!confirm('Are you sure you want to remove this product?')) return;
  
  try {
    await remove(dbRef(database, `products/${productId}`));
    showMessage('Product removed successfully', 'success');
  } catch (error) {
    console.error('Error removing product:', error);
    showMessage('Failed to remove product', 'error');
  }
}

// Add product form handler
addProductForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    name: e.target.prodName.value.trim(),
    description: e.target.prodDesc.value.trim(),
    price: parseFloat(e.target.prodPrice.value).toFixed(2),
    imageUrl: e.target.prodImage.value.trim()
  };
  
  try {
    const newProdRef = push(dbRef(database, 'products'));
    await set(newProdRef, formData);
    showMessage('Product added successfully!', 'success');
    addProductForm.reset();
  } catch (error) {
    console.error('Error adding product:', error);
    showMessage('Failed to add product', 'error');
  }
});

// Load orders
function loadOrders() {
  const ordersRef = dbRef(database, 'orders');
  onValue(ordersRef, (snapshot) => {
    const data = snapshot.val();
    renderOrders(data);
  });
}

function renderOrders(orders) {
  ordersTableBody.innerHTML = '';
  if (!orders) {
    ordersTableBody.innerHTML = '<tr><td colspan="4" class="no-orders">No orders placed yet.</td></tr>';
    return;
  }

  const productsRef = dbRef(database, 'products');
  onValue(productsRef, (prodSnapshot) => {
    const products = prodSnapshot.val() || {};
    
    Object.entries(orders).forEach(([orderId, order]) => {
      const { productId, email, timestamp } = order;
      const product = products[productId] || { name: 'Unknown Product' };
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${orderId}</td>
        <td>${product.name}</td>
        <td>${email}</td>
        <td>${new Date(timestamp).toLocaleString()}</td>
      `;
      ordersTableBody.appendChild(row);
    });
  });
}