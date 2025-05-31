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

const app       = initializeApp(firebaseConfig);
const auth      = getAuth(app);
const database  = getDatabase(app);

// ------------------------------
// 3) DOM ELEMENTS (BY ID – MUST MATCH admin.html)
// ------------------------------
const loginWrapper         = document.getElementById('loginWrapper');
const loginForm            = document.getElementById('loginForm');
const loginEmail           = document.getElementById('loginEmail');
const loginPassword        = document.getElementById('loginPassword');

const dashboardSection     = document.getElementById('dashboardSection');
const logoutBtn            = document.getElementById('logoutBtn');

const addProductForm       = document.getElementById('addProductForm');
const prodNameInput        = document.getElementById('prodName');
const prodDescInput        = document.getElementById('prodDesc');
const prodPriceInput       = document.getElementById('prodPrice');
const prodImageInput       = document.getElementById('prodImage');
const existingProductsList = document.getElementById('existingProductsList');
const ordersTableBody      = document.querySelector('#ordersTable tbody');

// ------------------------------
// 4) AUTHENTICATION HANDLING
// ------------------------------
onAuthStateChanged(auth, (user) => {
  console.log("onAuthStateChanged fired; user =", user);

  if (user) {
    console.log("→ user is signed in; hiding login, showing dashboard.");
    loginWrapper.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');

    // Once signed in, load “Existing Products” and “Orders”
    loadExistingProducts();
    loadOrders();
  } else {
    console.log("→ no user signed in; showing login form.");
    loginWrapper.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    logoutBtn.classList.add('hidden');
  }
});

// Handle Login Form Submit
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email    = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      console.log("signInWithEmailAndPassword → success");
      loginForm.reset();
    })
    .catch((error) => {
      console.error("Login error:", error);
      alert("Login failed: " + error.message);
    });
});

// Handle Logout Button
logoutBtn.addEventListener('click', () => {
  signOut(auth)
    .then(() => {
      console.log("User signed out.");
    })
    .catch((err) => {
      console.error("Logout error:", err);
    });
});

// ------------------------------
// 5) ADD NEW PRODUCT
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
  set(newProdRef, { name, description, price, imageUrl })
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
// 6) LOAD & DISPLAY EXISTING PRODUCTS
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

    // Create a small “card” for each product
    const card = document.createElement('div');
    card.classList.add('product-card');

    // Product Image
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = name;
    card.appendChild(img);

    // Product Info
    const infoDiv = document.createElement('div');
    infoDiv.innerHTML = `
      <h3>${name}</h3>
      <p>${description}</p>
      <div class="price">$${parseFloat(price).toFixed(2)}</div>
    `;
    card.appendChild(infoDiv);

    // “Remove” Button
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
// 7) LOAD & DISPLAY ORDERS
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

  // Once, fetch all products to map productId → productName
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
    })
    .catch((err) => {
      console.error("Error fetching products for orders:", err);
    });
}
