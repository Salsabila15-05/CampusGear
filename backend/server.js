const peminjamanRoutes = require('./routes/peminjaman');
const barangRoutes = require('./routes/barang');
const authRoutes = require('./routes/auth');
const express = require('express');
const cors = require('cors');

app.use(cors({
  origin: '*'
}));

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/barang', barangRoutes);
app.use('/peminjaman', peminjamanRoutes);

app.get('/', (req, res) => {
    res.send('Server CampusGear Berjalan');
});

app.listen(3000, () => {
    console.log('Server berjalan di port 3000');
});