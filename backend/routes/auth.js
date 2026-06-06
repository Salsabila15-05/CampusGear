const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// REGISTER
router.post('/register', async (req, res) => {
  const { nama, nomor_identitas, nomor_hp, password, role } = req.body;

  // 1. Cek mahasiswa_aktif
  db.query('SELECT * FROM mahasiswa_aktif WHERE npm = ?', [nomor_identitas], async (err, result) => {
    if(err) return res.status(500).json({ message: 'Server error' });

    if(result.length === 0)
      return res.status(400).json({ message: 'NPM tidak terdaftar' });

    if(result[0].nama.toLowerCase() !== nama.toLowerCase())
      return res.status(400).json({ message: 'Nama tidak sesuai data kampus' });

    // 2. Cek akun sudah ada
    db.query('SELECT * FROM users WHERE nomor_identitas = ?', [nomor_identitas], async (err, userResult) => {
      if(err) return res.status(500).json({ message: 'Server error' });

      if(userResult.length > 0)
        return res.status(400).json({ message: 'Akun sudah terdaftar' });

      // 3. Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 4. Insert user
      db.query(
        'INSERT INTO users (nama, nomor_identitas, nomor_hp, password, role, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
        [nama, nomor_identitas, nomor_hp, hashedPassword, role || 'mahasiswa', 1],
        (err) => {
          if(err){
            console.log(err);
            return res.status(500).json({ message: 'Register gagal' });
          }
          res.json({ message: 'Register berhasil' });
        }
      );
    });
  });
});

// LOGIN
router.post('/login', (req, res) => {
  const { nomor_identitas, password } = req.body;

  db.query('SELECT * FROM users WHERE nomor_identitas = ?', [nomor_identitas], async (err, result) => {
    if(err) return res.status(500).json({ message: 'Server error' });

    if(result.length === 0)
      return res.status(404).json({ message: 'Akun tidak ditemukan' });

    const user = result[0];

    const cocok = await bcrypt.compare(password, user.password);
    if(!cocok)
      return res.status(401).json({ message: 'Password salah' });

    const token = jwt.sign(
      { id: user.id_user, nomor_identitas: user.nomor_identitas, role: user.role },
      'secretkey',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id_user,
        nama: user.nama,
        nomor_identitas: user.nomor_identitas,
        nomor_hp: user.nomor_hp,
        role: user.role
      }
    });
  });
});

module.exports = router;