const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'isi MYSQLHOST',
  port: 'isi MYSQLPORT',
  user: 'isi MYSQLUSER',
  password: 'isi MYSQLPASSWORD',
  database: 'isi MYSQLDATABASE'
});

connection.connect((err) => {
  if(err){
    console.log('Database gagal terkoneksi', err);
  } else {
    console.log('Database berhasil terkoneksi');
  }
});

module.exports = connection;