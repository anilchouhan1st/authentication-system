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

            let toast = null;

            if (req.query.welcome === "true") {
                toast = {
                    type: "success",
                    title: "Login Successful",
                    message: `Welcome back, ${results[0].name}!`
                };
            }
            
            if (req.query.passwordChanged === "true") {
                toast = {
                    type: "success",
                    title: "Success",
                    message: "Password changed successfully!"
                };
            }

            res.render("dashboard", {
                user: results[0],
                isDashboard: true,
                toast
            });
        }
    );

});

router.get("/logout", (req, res) => {

    res.clearCookie("jwt");

    res.redirect("/login");
});

module.exports = router;
