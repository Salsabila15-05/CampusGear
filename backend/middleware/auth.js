const jwt = require('jsonwebtoken');

function verifyToken(req, res, next){

    const bearerHeader = req.headers['authorization'];

    if(!bearerHeader){

        return res.status(401).json({
            message:'Token tidak tersedia'
        });

    }

    const bearer = bearerHeader.split(' ');

    const token = bearer[1];

    jwt.verify(
        token,
        'secretkey',
        (err, authData) => {

            if(err){

                return res.status(403).json({
                    message:'Token tidak valid'
                });

            }

            req.user = authData;

            next();

        }
    );

}

module.exports = verifyToken;