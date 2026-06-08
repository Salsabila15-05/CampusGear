const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Tidak terautentikasi' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat mengakses ini.' });
  }

  next();
};

module.exports = verifyAdmin;