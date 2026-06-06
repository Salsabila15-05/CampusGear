function verifyAdmin(req, res, next){

    if(req.user.role !== 'admin'){

        return res.status(403).json({
            message:'Akses admin ditolak'
        });

    }

    next();

}

module.exports = verifyAdmin;