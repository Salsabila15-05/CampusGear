const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET_KEY = process.env.JWT_SECRET || 'campusgear_secret_key';

// ==================== REGISTER ====================
router.post('/register', async (req, res) => {
  const { nama, nomor_identitas, nomor_hp, password, role } = req.body;

  // Validasi field wajib
  if (!nama || !nomor_identitas || !nomor_hp || !password) {
    return res.status(400).json({ message: 'Semua field wajib diisi' });
  }

  // Validasi format NPM/NIDN (harus angka, 8-20 digit)
  if (!/^\d{8,20}$/.test(nomor_identitas.trim())) {
    return res.status(400).json({ message: 'NPM/NIDN harus berupa angka (8-20 digit)' });
  }

  // Cek apakah NPM/NIDN sudah terdaftar
  db.query(
    'SELECT id_user FROM users WHERE nomor_identitas = ?',
    [nomor_identitas.trim()],
    async (err, userResult) => {
      if (err) return res.status(500).json({ message: 'Server error' });

      if (userResult.length > 0) {
        return res.status(400).json({ message: 'NPM/NIDN sudah terdaftar' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Simpan user baru
      db.query(
        'INSERT INTO users (nama, nomor_identitas, nomor_hp, password, role) VALUES (?, ?, ?, ?, ?)',
        [
          nama.trim(),
          nomor_identitas.trim(),
          nomor_hp.trim(),
          hashedPassword,
          role || 'mahasiswa'
        ],
        (err) => {
          if (err) {
            console.error('Insert error:', err);
            return res.status(500).json({ message: 'Register gagal' });
          }
          res.status(201).json({ message: 'Register berhasil' });
        }
      );
    }
  );
});

// ==================== LOGIN ====================
router.post('/login', (req, res) => {
  const { nomor_identitas, password } = req.body;

  if (!nomor_identitas || !password) {
    return res.status(400).json({ message: 'NPM/NIDN dan password wajib diisi' });
  }

  db.query(
    'SELECT * FROM users WHERE nomor_identitas = ?',
    [nomor_identitas.trim()],
    async (err, result) => {
      if (err) return res.status(500).json({ message: 'Server error' });

      if (result.length === 0) {
        return res.status(401).json({ message: 'NPM/NIDN atau password salah' });
      }

      const user = result[0];

      // Cek password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'NPM/NIDN atau password salah' });
      }

      // Buat JWT token — berlaku 24 jam
      const token = jwt.sign(
        {
          id: user.id_user,
          nama: user.nama,
          role: user.role,
          nomor_identitas: user.nomor_identitas
        },
        SECRET_KEY,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login berhasil',
        token,
        user: {
          id: user.id_user,
          nama: user.nama,
          role: user.role,
          nomor_identitas: user.nomor_identitas
        }
      });
    }
  );
});

module.exports = router;