const mysql = require('mysql2');

const connection = mysql.createConnection({
  host     : process.env.MYSQLHOST,
  port     : process.env.MYSQLPORT,
  user     : process.env.MYSQLUSER,
  password : process.env.MYSQLPASSWORD,
  database : process.env.MYSQLDATABASE
});

connection.connect((err) => {
  if(err){
    console.log('Database gagal terkoneksi', err);
  } else {
    console.log('Database berhasil terkoneksi');
  }
});

module.exports = connection;
