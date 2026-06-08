const verifyToken = require('../middleware/auth');
const verifyAdmin = require('../middleware/admin');
const express = require('express');
const router = express.Router();
const db = require('../db');

// TAMBAH PEMINJAMAN
router.post('/tambah', verifyToken, (req, res) => {
  const { id_barang, tanggal_pinjam, tanggal_kembali, waktu_pinjam, waktu_kembali, kelas, keperluan } = req.body;
  const id_user = req.user.id;

  if(!id_barang || !tanggal_pinjam || !tanggal_kembali){
    return res.status(400).json({ message: 'Semua data wajib diisi' });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tglPinjam = new Date(tanggal_pinjam);

  if(tglPinjam < today){
    return res.status(400).json({ message: 'Tanggal pinjam tidak valid' });
  }

  db.query('SELECT * FROM users WHERE id_user = ?', [id_user], (err, userResult) => {
    if(err){ console.log('ERROR users:', err.message); return res.status(500).json({ message: 'Server error' }); }
    if(userResult.length === 0) return res.status(404).json({ message: 'User tidak ditemukan' });

    const user = userResult[0];

    db.query("SELECT * FROM peminjaman WHERE user_id = ? AND status = 'menunggu'", [id_user], (err, hasilPinjam) => {
      if(err){ console.log('ERROR limit:', err.message); return res.status(500).json({ message: 'Server error' }); }

      const limit = (user.role === 'dosen' || user.role === 'admin') ? 5 : 2;
      if(hasilPinjam.length >= limit){
        return res.status(400).json({ message: 'Limit peminjaman ' + limit + ' barang' });
      }

      db.query('SELECT * FROM barang WHERE id_barang = ?', [id_barang], (err, barangResult) => {
        if(err){ console.log('ERROR barang:', err.message); return res.status(500).json({ message: 'Server error' }); }
        if(barangResult.length === 0) return res.status(404).json({ message: 'Barang tidak ditemukan' });

        const barang = barangResult[0];

        if(barang.stok <= 0){
          return res.status(400).json({ message: 'Stok barang habis' });
        }

        db.query(
          "SELECT * FROM peminjaman WHERE user_id = ? AND barang = ? AND status IN ('menunggu','disetujui')",
          [id_user, barang.nama_barang],
          (err, dupResult) => {
            if(err){ console.log('ERROR dup:', err.message); return res.status(500).json({ message: 'Server error' }); }
            if(dupResult.length > 0){
              return res.status(400).json({ message: 'Barang ini masih sedang dipinjam' });
            }

            db.query(
              'INSERT INTO peminjaman (user_id, nama, npm, kelas, barang, tgl_pinjam, waktu_pinjam, tgl_kembali, waktu_kembali, keperluan, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [
                id_user, user.nama, user.nomor_identitas,
                kelas || '-', barang.nama_barang,
                tanggal_pinjam, waktu_pinjam || null,
                tanggal_kembali, waktu_kembali || null,
                keperluan || '-', 'menunggu'
              ],
              (err) => {
                if(err){ console.log('ERROR insert:', err.message); return res.status(500).json({ message: 'Peminjaman gagal' }); }
                db.query('UPDATE barang SET stok = stok - 1 WHERE id_barang = ?', [id_barang]);
                res.json({ message: 'Peminjaman berhasil diajukan' });
              }
            );
          }
        );
      });
    });
  });
});

// RIWAYAT MILIK USER
router.get('/riwayat', verifyToken, (req, res) => {
  db.query(
    'SELECT * FROM peminjaman WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, result) => {
      if(err) return res.status(500).json({ message: 'Gagal mengambil data' });
      res.json({ data: result });
    }
  );
});

// SEMUA PEMINJAMAN UNTUK ADMIN
router.get('/semua', verifyToken, verifyAdmin, (req, res) => {
  db.query(
    'SELECT * FROM peminjaman ORDER BY created_at DESC',
    (err, result) => {
      if(err) return res.status(500).json({ message: 'Gagal mengambil data' });
      res.json({ data: result });
    }
  );
});

// AMBIL SEMUA
router.get('/', verifyToken, (req, res) => {
  db.query(
    'SELECT * FROM peminjaman ORDER BY created_at DESC',
    (err, result) => {
      if(err) return res.status(500).json({ message: 'Gagal mengambil data' });
      res.json(result);
    }
  );
});

// SETUJUI
router.put('/setujui/:id', verifyToken, verifyAdmin, (req, res) => {
  db.query(
    "UPDATE peminjaman SET status = 'disetujui' WHERE id = ?",
    [req.params.id],
    (err) => {
      if(err) return res.status(500).json({ message: 'Gagal menyetujui' });
      res.json({ message: 'Peminjaman disetujui' });
    }
  );
});

// TOLAK — kembalikan stok
router.put('/tolak/:id', verifyToken, verifyAdmin, (req, res) => {
  db.query('SELECT barang FROM peminjaman WHERE id = ?', [req.params.id], (err, result) => {
    if(err || result.length === 0) return res.status(500).json({ message: 'Gagal menemukan peminjaman' });

    const namaBarang = result[0].barang;

    db.query("UPDATE peminjaman SET status = 'ditolak' WHERE id = ?", [req.params.id], (err) => {
      if(err) return res.status(500).json({ message: 'Gagal menolak' });

      // ✅ Kembalikan stok saat ditolak
      db.query('UPDATE barang SET stok = stok + 1 WHERE nama_barang = ?', [namaBarang]);

      res.json({ message: 'Peminjaman ditolak' });
    });
  });
});

// KEMBALIKAN — update status + kembalikan stok
router.put('/kembalikan/:id', verifyToken, verifyAdmin, (req, res) => {
  // Ambil nama barang dulu, baru update stok
  db.query('SELECT barang FROM peminjaman WHERE id = ?', [req.params.id], (err, result) => {
    if(err || result.length === 0) return res.status(500).json({ message: 'Gagal menemukan peminjaman' });

    const namaBarang = result[0].barang;

    db.query("UPDATE peminjaman SET status = 'dikembalikan' WHERE id = ?", [req.params.id], (err) => {
      if(err) return res.status(500).json({ message: 'Gagal mengembalikan' });

      // ✅ Update stok pakai nama barang langsung
      db.query('UPDATE barang SET stok = stok + 1 WHERE nama_barang = ?', [namaBarang], (err) => {
        if(err) console.log('ERROR update stok:', err.message);
      });

      res.json({ message: 'Barang berhasil dikembalikan' });
    });
  });
});

module.exports = router;