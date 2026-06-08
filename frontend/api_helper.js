const BASE_URL = 'http://localhost:3000';

// Ambil token dari localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Ambil data user yang login
function getUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

// Cek apakah sudah login, kalau belum redirect ke login
function requireLogin() {
  const token = getToken();
  if (!token) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

// Logout: hapus token dan redirect
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// ==================== FETCH HELPER ====================

// ==================== LOGIN HELPER (tanpa token) ====================

async function apiLogin(endpoint, body) {
 const response = await fetch(BASE_URL + endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  return response.json();
}

// GET request dengan token otomatis
async function apiGet(endpoint) {
  const token = getToken();
  if (!token) {
    logout();
    return null;
  }

  const response = await fetch(BASE_URL + endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token   // ✅ Token dikirim di sini
    }
  });

  if (response.status === 401) {
    // Token tidak valid atau kedaluwarsa
    alert('Sesi kamu telah berakhir. Silakan login ulang.');
    logout();
    return null;
  }

  return response.json();
}

// POST request dengan token otomatis
async function apiPost(endpoint, body) {
  const token = getToken();
  if (!token) {
    logout();
    return null;
  }

  const response = await fetch(BASE_URL + endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token   // ✅ Token dikirim di sini
    },
    body: JSON.stringify(body)
  });

  if (response.status === 401) {
    alert('Sesi kamu telah berakhir. Silakan login ulang.');
    logout();
    return null;
  }

  return response.json();
}

// PUT request dengan token otomatis
async function apiPut(endpoint, body) {
  const token = getToken();
  if (!token) {
    logout();
    return null;
  }

  const response = await fetch(BASE_URL + endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify(body)
  });

  if (response.status === 401) {
    alert('Sesi kamu telah berakhir. Silakan login ulang.');
    logout();
    return null;
  }

  return response.json();
}