// ------------------------------
// 1) IMPORT FIREBASE SDKS
// ------------------------------
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// ------------------------------
// 3) DOM ELEMENTS
// ------------------------------
const loginWrapper          = document.getElementById('loginWrapper');
const loginSection          = document.getElementById('loginSection');
const loginForm             = document.getElementById('loginForm');
const loginEmail            = document.getElementById('loginEmail');
const loginPassword         = document.getElementById('loginPassword');

const dashboardSection      = document.getElementById('dashboardSection');
const logoutBtn             = document.getElementById('logoutBtn');

const addProductForm        = document.getElementById('addProductForm');
const prodNameInput         = document.getElementById('prodName');
const prodDescInput         = document.getElementById('prodDesc');
const prodPriceInput        = document.getElementById('prodPrice');
const prodImageInput        = document.getElementById('prodImage');
const existingProductsList  = document.getElementById('existingProductsList');
const ordersTableBody       = document.querySelector('#ordersTable tbody');

// ------------------------------
// 4) AUTHENTICATION HANDLING
// ------------------------------
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Admin is signed in: hide login, show dashboard
    loginWrapper.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
    loadExistingProducts();
    loadOrders();
  } else {
    // Not signed in: show login, hide dashboard
    loginWrapper.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    logoutBtn.classList.add('hidden');
  }
});

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      loginForm.reset();
    })
    .catch((error) => {
      console.error('Login error:', error.message);
      alert('Login failed: ' + error.message);
    });
});

logoutBtn.addEventListener('click', () => {
  signOut(auth)
    .then(() => {
      alert('Logged out successfully.');
    })
    .catch((err) => {
      console.error('Logout error:', err);
    });
});

// ------------------------------
// 5) ADD NEW PRODUCT FUNCTIONALITY
// ------------------------------
addProductForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name        = prodNameInput.value.trim();
  const description = prodDescInput.value.trim();
  const price       = parseFloat(prodPriceInput.value).toFixed(2);
  const imageUrl    = prodImageInput.value.trim();

  if (!name || !description || !price || !imageUrl) {
    alert('Please fill in all fields.');
    return;
  }

  const productsRef = dbRef(database, 'products');
  const newProdRef  = push(productsRef);
  set(newProdRef, {
    name,
    description,
    price,
    imageUrl
  })
    .then(() => {
      alert('Product added successfully!');
      addProductForm.reset();
    })
    .catch((err) => {
      console.error('Error adding product:', err);
      alert('Failed to add product.');
    });
});

// ------------------------------
// 6) LOAD AND DISPLAY EXISTING PRODUCTS
// ------------------------------
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
    existingProductsList.innerHTML =
      '<p style="color:#777; text-align:center;">No products found.</p>';
    return;
  }

  Object.keys(products).forEach((key) => {
    const { name, description, price, imageUrl } = products[key];

    // Create a product card
    const card = document.createElement('div');
    card.classList.add('product-card');

    // Image
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = name;
    card.appendChild(img);

    // Info
    const infoDiv = document.createElement('div');
    infoDiv.innerHTML = `
      <h3>${name}</h3>
      <p>${description}</p>
      <div class="price">$${parseFloat(price).toFixed(2)}</div>
    `;
    card.appendChild(infoDiv);

    // Remove Button
    const removeBtn = document.createElement('button');
    removeBtn.classList.add('buy-btn');
    removeBtn.style.background = '#f00';
    removeBtn.style.color = '#fff';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => removeProduct(key));
    card.appendChild(removeBtn);

    existingProductsList.appendChild(card);
  });
}

function removeProduct(productId) {
  if (!confirm('Are you sure you want to remove this product?')) return;

  const singleProdRef = dbRef(database, `products/${productId}`);
  remove(singleProdRef)
    .then(() => {
      alert('Product removed.');
    })
    .catch((err) => {
      console.error('Error removing product:', err);
      alert('Failed to remove product.');
    });
}

// ------------------------------
// 7) LOAD AND DISPLAY ORDERS
// ------------------------------
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
    ordersTableBody.innerHTML =
      '<tr><td colspan="4" style="color:#777; text-align:center;">No orders placed yet.</td></tr>';
    return;
  }

  // Fetch products once to map productId → productName
  dbRef(database, 'products')
    .once('value')
    .then((prodSnap) => {
      const prodData = prodSnap.val() || {};

      Object.keys(orders).forEach((orderId) => {
        const { productId, email, timestamp } = orders[orderId];
        const productName = prodData[productId]?.name || 'Unknown';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${orderId}</td>
          <td>${productName}</td>
          <td>${email}</td>
          <td>${new Date(timestamp).toLocaleString()}</td>
        `;
        ordersTableBody.appendChild(tr);
      });
    });
}
