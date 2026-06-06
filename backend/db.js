const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'campusgear'
});

connection.connect((err) => {
    if(err){
        console.log('Database gagal terkoneksi');
    } else {
        console.log('Database berhasil terkoneksi');
    }
});

module.exports = connection;