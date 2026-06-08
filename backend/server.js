const peminjamanRoutes = require('./routes/peminjaman');
const barangRoutes = require('./routes/barang');
const authRoutes = require('./routes/auth');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
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