const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require("cookie-parser");
const hbs = require("hbs");


dotenv.config({path:'./.env'});

const app=express();

const db = require("./db");

app.use(cookieParser());

console.log("JWT_SECRET =", process.env.JWT_SECRET);

hbs.registerPartials(
    path.join(__dirname, "views", "partials")
);


const publicDirectory = path.join(__dirname,"./public");
app.use(express.static(publicDirectory));


app.use(express.urlencoded( {extended:false}));

app.use(express.json());

app.set('view engine','hbs');
app.disable('view cache');
app.set('view cache', false);

app.set("views", path.join(__dirname, "views"));
hbs.registerPartials(
    path.join(__dirname, "views", "partials")
);


app.use('/',require("./routes/page"));
app.use('/auth',require('./routes/auth'));

app.use(express.static('public'));

app.listen(5000,()=>{
    console.log("server started on port 5000");
});
