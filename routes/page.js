const express =require("express");
const db = require("../db");
const authController = require("../controllers/auth");

const router=express.Router();

const jwt = require("jsonwebtoken");

router.get("/", (req, res) => {
    res.redirect("/login");
});

router.get("/login", (req, res) => {
    res.render("login", {
        isLogin: true
    });
});

router.get("/register", (req, res) => {
    res.render("register", {
        isRegister: true
    });
});

router.get("/forgot-password", (req, res) => {
    res.render("forgot-password");
});



router.get("/dashboard", authController.protect, (req, res) => {

    db.query(
        "SELECT * FROM users WHERE id = ?",
        [req.user.id],
        (error, results) => {

            if (error || results.length === 0) {
                return res.redirect("/login");
            }

            res.render("dashboard", {
                user: results[0],
                isDashboard: true
            });
        }
    );

});

router.get("/logout", (req, res) => {

    res.clearCookie("jwt");

    res.redirect("/login");
});

module.exports = router;
