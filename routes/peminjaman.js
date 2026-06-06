const verifyToken = require('../middleware/auth');
const verifyAdmin = require('../middleware/admin');
const express = require('express');
const router = express.Router();
const db = require('../db');

// TAMBAH PEMINJAMAN
router.post('/tambah', verifyToken, (req, res) => {
  const { id_barang, tanggal_pinjam, tanggal_kembali } = req.body;
  const id_user = req.user.id;

  if(!id_barang || !tanggal_pinjam || !tanggal_kembali){
    return res.status(400).json({ message: 'Semua data wajib diisi' });
  }

  // Validasi tanggal
  const today = new Date();
today.setHours(0, 0, 0, 0);
const tglPinjam  = new Date(tanggal_pinjam);
const tglKembali = new Date(tanggal_kembali);

console.log('today    :', today);
console.log('tglPinjam:', tglPinjam);
console.log('input    :', tanggal_pinjam);

if(tglPinjam < today){
  return res.status(400).json({ message: 'Tanggal pinjam tidak valid' });
}

  // Ambil data user
  db.query('SELECT * FROM users WHERE id_user = ?', [id_user], (err, userResult) => {
    if(err) return res.status(500).json({ message: 'Server error' });
    if(userResult.length === 0) return res.status(404).json({ message: 'User tidak ditemukan' });

    const user = userResult[0];

    // Cek limit peminjaman
    db.query(
      "SELECT * FROM peminjaman WHERE user_id = ? AND status = 'menunggu'",
      [id_user],
      (err, hasilPinjam) => {
        if(err) return res.status(500).json({ message: 'Server error' });

        const limit = (user.role === 'dosen' || user.role === 'admin') ? 5 : 2;
        if(hasilPinjam.length >= limit){
          return res.status(400).json({ message: 'Limit peminjaman ' + limit + ' barang' });
        }

        // Cek barang
        db.query('SELECT * FROM barang WHERE id_barang = ?', [id_barang], (err, barangResult) => {
          if(err) return res.status(500).json({ message: 'Server error' });
          if(barangResult.length === 0) return res.status(404).json({ message: 'Barang tidak ditemukan' });

          const barang = barangResult[0];

          if(barang.stok <= 0){
            return res.status(400).json({ message: 'Stok barang habis' });
          }

          // Cek duplikat
          db.query(
            "SELECT * FROM peminjaman WHERE user_id = ? AND barang = ? AND status IN ('menunggu','disetujui')",
            [id_user, barang.nama_barang],
            (err, dupResult) => {
              if(err) return res.status(500).json({ message: 'Server error' });
              if(dupResult.length > 0){
                return res.status(400).json({ message: 'Barang ini masih sedang dipinjam' });
              }

              // Insert peminjaman
              db.query(
                'INSERT INTO peminjaman (user_id, nama, npm, kelas, barang, tgl_pinjam, tgl_kembali, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [id_user, user.nama, user.nomor_identitas, '-', barang.nama_barang, tanggal_pinjam, tanggal_kembali, 'menunggu'],
                (err) => {
                  if(err){
                    console.log(err);
                    return res.status(500).json({ message: 'Peminjaman gagal' });
                  }

                  // Kurangi stok
                  db.query('UPDATE barang SET stok = stok - 1 WHERE id_barang = ?', [id_barang]);

                  res.json({ message: 'Peminjaman berhasil diajukan' });
                }
              );
            }
          );
        });
      }
    );
  });
});

// AMBIL SEMUA PEMINJAMAN
router.get('/', verifyToken, (req, res) => {
  db.query(
    'SELECT * FROM peminjaman ORDER BY created_at DESC',
    (err, result) => {
      if(err) return res.status(500).json({ message: 'Gagal mengambil data' });
      res.json(result);
    }
  );
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

// UPDATE STATUS OLEH ADMIN
router.put('/status/:id', verifyToken, verifyAdmin, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  db.query(
    'UPDATE peminjaman SET status = ? WHERE id = ?',
    [status, id],
    (err) => {
      if(err) return res.status(500).json({ message: 'Gagal update status' });

      // Kalau ditolak, kembalikan stok
      if(status === 'ditolak'){
        db.query(
          'UPDATE barang b JOIN peminjaman p ON b.nama_barang = p.barang SET b.stok = b.stok + 1 WHERE p.id = ?',
          [id]
        );
      }

      res.json({ message: 'Status berhasil diupdate' });
    }
  );
});

// SETUJUI (endpoint lama)
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

// TOLAK (endpoint lama)
router.put('/tolak/:id', verifyToken, verifyAdmin, (req, res) => {
  db.query(
    "UPDATE peminjaman SET status = 'ditolak' WHERE id = ?",
    [req.params.id],
    (err) => {
      if(err) return res.status(500).json({ message: 'Gagal menolak' });

      // Kembalikan stok
      db.query(
        'UPDATE barang b JOIN peminjaman p ON b.nama_barang = p.barang SET b.stok = b.stok + 1 WHERE p.id = ?',
        [req.params.id]
      );

      res.json({ message: 'Peminjaman ditolak' });
    }
  );
});

module.exports = router;