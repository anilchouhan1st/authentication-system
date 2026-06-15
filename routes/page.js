const express =require("express");
const db = require("../db");

const router=express.Router();

router.get("/",(req,res)=>{
    res.render("index");
})

router.get("/register",(req,res)=>{
    res.render("register");
})

router.get('/login', (req, res) => {
    res.render('login');
});

const jwt = require("jsonwebtoken");

router.get("/dashboard", (req, res) => {

    const token = req.cookies.jwt;

    if (!token) {
        return res.redirect("/login");
    }

    const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
    );

    db.query(
    "SELECT * FROM records WHERE id = ?",
    [decoded.id],
    (error, results) => {

        if (error) {
            console.log(error);
        }

        console.log(results);

       res.render("dashboard", {
        user: results[0]
        });
    }
);
});

module.exports = router;