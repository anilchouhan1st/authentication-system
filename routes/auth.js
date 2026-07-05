const express =require("express");
const authController=require('../controllers/auth');
const transporter = require("../config/mail");

const router=express.Router();

router.post("/register",authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);

router.get("/test-email", async (req, res) => {
    try {
        const info = await transporter.sendMail({
            from: '"Authentication System" <no-reply@example.com>',
            to: process.env.EMAIL_USER,
            subject: "Test Email",
            text: "Congratulations! Your email configuration is working.",
            html: "<h2>🎉 Congratulations!</h2><p>Your email configuration is working.</p>"
        });

        console.log("Message sent:", info.messageId);

        res.send("Email sent successfully!");
    } catch (err) {
        console.error(err);
        res.send("Failed to send email.");
    }
});

router.get("/verify/:token", authController.verifyEmail);

router.get("/reset-password/:token", authController.resetPasswordPage);

router.post("/reset-password/:token", authController.resetPassword);

module.exports = router;