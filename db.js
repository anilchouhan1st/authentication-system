const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});


db.connect((err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("Connected to Railway MySQL");
    }
});
module.exports = db;