const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({path:'./.env'});
const app=express();

console.log("JWT_SECRET =", process.env.JWT_SECRET);

const db = mysql.createConnection({
    host:process.env.DATABASE_HOST,
    user:process.env.DATABASE_USER,
    password:process.env.DATABASE_PASSWORD,
    database:process.env.DATABASE
});

const publicDirectory = path.join(__dirname,"./public");
app.use(express.static(publicDirectory));

// Parse URL-encoded bodies (as send by html forms)
//It reads data sent from HTML forms.
app.use(express.urlencoded( {extended:false}));
// parse JSON bodies (as send by API clients)
//It reads JSON data sent by APIs or frontend apps.
app.use(express.json());

app.set('view engine','hbs');

db.connect((error)=>{
    if(error){
        console.log(error);
    } else {
        console.log("Mysql is Connected");
    }
});


app.use('/',require("./routes/page"));
app.use('/auth',require('./routes/auth'));

// app.post("/test", (req, res) => {

//     console.log(req.body);

//     res.send("working");
// });

app.listen(5000,()=>{
    console.log("server started on port 5000");
});