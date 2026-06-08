const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'campusgear_secret_key';

const verifyToken = (req, res, next) => {
  // Ambil token dari header Authorization
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  // Format header: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Format token tidak valid' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // { id, nama, role, nomor_identitas }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token kedaluwarsa, silakan login ulang' });
    }
    return res.status(401).json({ message: 'Token tidak valid' });
  }
};

module.exports = verifyToken;