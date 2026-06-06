const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {

    const sql = 'SELECT * FROM barang';

    db.query(sql, (err, result) => {

        if(err){
            return res.status(500).json({
                message: 'Gagal mengambil data barang'
            });
        }

        res.json(result);

    });

});

router.post('/tambah', (req, res) => {

    const { nama_barang, stok, kondisi_barang } = req.body;

    const sql = `
        INSERT INTO barang (nama_barang, stok, kondisi_barang)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [nama_barang, stok, kondisi_barang], (err, result) => {

        if(err){
            return res.status(500).json({
                message: 'Gagal menambah barang'
            });
        }

        res.json({
            message: 'Barang berhasil ditambahkan'
        });

    });

});

module.exports = router;