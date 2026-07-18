const express =require("express");
const authController=require('../controllers/auth');
const transporter = require("../config/mail");
const { loginLimiter } = require("../middleware/rateLimiter");
const router=express.Router();

router.post("/register",authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);

router.get("/verify/:token", authController.verifyEmail);

router.get("/reset-password/:token", authController.resetPasswordPage);

router.post("/reset-password/:token", authController.resetPassword);

router.post("/login", loginLimiter, authController.login);

module.exports = router;

module.exports = router;