const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require("cookie-parser");
const hbs = require("hbs");


dotenv.config({path:'./.env'});

const app=express();

const db = require("./db");

app.use(cookieParser());

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

app.use('/',require("./routes/page"));
app.use('/auth',require('./routes/auth'));

const helmet = require("helmet");
app.use(helmet());

hbs.registerHelper("eq", function(a, b) {
    return a === b;
});


// app.use(express.static('public'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.get("/test-error", (req, res) => {

    throw new Error("Testing 500 Page");

});

app.use((req, res) => {
    res.status(404).render("404", {
        title: "404 - Page Not Found"
    });
});

app.use((err, req, res, next) => {

    console.error(err);

    res.status(500).render("500", {
        title: "500 - Internal Server Error"
    });

});
