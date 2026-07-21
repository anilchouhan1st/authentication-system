const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("../db");
const transporter = require("../config/mail");

exports.protect = (req, res, next) => {

    const token = req.cookies.jwt;

    if (!token) {
        return res.redirect("/login");
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();

    } catch (err) {

        return res.redirect("/login");
    }
};

exports.verifyEmail = async (req, res) => {

    const token = req.params.token;

    db.query(
        "SELECT * FROM users WHERE verification_token = ?",
        [token],
        (error, results) => {

            if (error) {
                console.log(error);
                return res.send("Database Error");
            }

            if (results.length === 0) {
                return res.render("auth-status", {                    
                    type: "error",
                    title: "❌ Verification Failed",
                    message: "This verification link is invalid or has expired.",
                    buttonText: "Register Again",
                    buttonLink: "/register"
                });
            }

            const user = results[0];

            if (user.is_verified) {
                return res.render("auth-status", {
                    type: "success",
                    title: "Email Verified",
                    message: "Your email has been verified successfully.",
                    buttonText: "Login",
                    buttonLink: "/login"
                });
            }

            if (user.verification_expires < new Date()) {
                return res.render("auth-status", {
                    type: "error",
                    title: "❌ Verification Failed",
                    message: "This verification link is invalid or has expired.",
                    buttonText: "Register again",
                    buttonLink: "/register"
                });
            }

            db.query(
                `UPDATE users
     SET is_verified = ?, 
         verification_token = NULL,
         verification_expires = NULL
     WHERE id = ?`,
                [true, user.id],
                (error) => {

                    if (error) {
                        console.log(error);
                        return res.send("Database Error");
                    }

                    res.render("auth-status", {
                        type: "success",
                        title: "🎉Email Verified",
                        message: "Your email has been verified successfully.",
                        buttonText: "Login Now",
                        buttonLink: "/login"
                    });
                }
            );;

        }
    );

};

exports.register = (req, res) => {
    

    const { name, email, password, Confirm_password } = req.body;

    db.query('select email from users where email = ?', [email], async (error, result) => {
        if (error) {
            console.log(error);
        }
        if (result.length > 0) {
            return res.render("register", {
                toast: {
                    type: "error",
                    title: "Email Exists",
                    message: "An account with this email already exists."
                }
            });
        } else if (password !== Confirm_password) {
            return res.render("register", {
                toast: {
                    type: "error",
                    title: "Error",
                    message: "Passwords do not match."
                }
            });
        };

        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

        if (!passwordRegex.test(password)) {
            return res.render("register", {

                toast: {
                    type: "warning",
                    title: "Weak Password",
                    message: "Password does not meet the required criteria."
                }
            });
        }

        let hashPassword = await bcrypt.hash(password, 8);

        const verificationToken = crypto.randomBytes(32).toString("hex");

        const verificationExpires = new Date(Date.now() + 60 * 60 * 1000);

        db.query('insert into users set ?', {
            name: name,
            email: email,
            password: hashPassword,
            is_verified: false,
            verification_token: verificationToken,
            verification_expires: verificationExpires
        }, async (error, result) => {

            if (error) {
                console.log(error);
            } else {
                console.log(result);

                const verificationLink =`${process.env.BASE_URL}/auth/verify/${verificationToken}`;

                await transporter.sendMail({
                    from: '"Authentication System" <no-reply@example.com>',
                    to: email,
                    subject: "Verify Your Email",
                    html: `
                        <h2>Welcome ${name}!</h2>
                        <p>Thank you for registering.</p>
                        <p>Please click the button below to verify your email.</p>

                        <a href="${verificationLink}"
                        style="
                            background:#007bff;
                            color:white;
                            padding:10px 20px;
                            text-decoration:none;
                            border-radius:5px;">
                            Verify Email
                        </a>

                        <p>This link expires in 1 hour.</p>
                    `
                });

                return res.render("register", {
                    toast: {
                        type: "info",
                        title: "Verification Sent",
                        message: "Please check your email to verify your account."
                    }
                });
            }

        });

    });


}

exports.login = (req, res) => {
    const { email, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (error, results) => {

            if (error) {
                console.log(error);
                return res.render("login", {
                    toast: {
                        type: "error",
                        title: "Server error",
                        message: "An error occurred while processing your request. Please try again later."
                    }
                });
            }

            if (results.length === 0) {
                return res.render("login", {
                    toast: {
                        type: "error",
                        title: "Error",
                        message: "No account found with this email."
                    }
                });
            }

            const user = results[0];

            const isMatch = await bcrypt.compare(
                password,
                user.password
            );

            if (!isMatch) {
                return res.render("login", {
                    toast: {
                        type: "error",
                        title: "Error",
                        message: "Incorrect password."
                    }
                });
            }

            if (!user.is_verified) {
                return res.render("login", {
                    toast: {
                        type: "error",
                        title: "Error",
                        message: "Please verify your email before logging in."
                    }
                });
            }

            // Generate JWT Token
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            );

            res.cookie("jwt", token, {
                httpOnly: true,
                sameSite: "Strict",
                secure: process.env.NODE_ENV === "production"
            });


            // res.redirect("/dashboard");
            res.redirect("/dashboard?welcome=true");
        }
    );
};

exports.forgotPassword = async (req, res) => {

    const { email } = req.body;

    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        (error, results) => {

            if (error) {
                console.log(error);
                return res.send("Database Error");
            }

            if (results.length === 0) {
                return res.render("forgot-password", {
                    toast: {
                        type: "error",
                        title: "Error",
                        message: "No account found with this email."
                    }
                });
            }

            const user = results[0];

            const resetToken = crypto.randomBytes(32).toString("hex");

            const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

            db.query(
                `UPDATE users
                SET reset_token = ?,
                    reset_expires = ?
                WHERE id = ?`,
                [resetToken, resetExpires, user.id],
                async (error) => {

                    if (error) {
                        console.log(error);
                        return res.send("Database Error");
                    }

                    const resetLink = `${process.env.BASE_URL}/auth/reset-password/${resetToken}`;

                    await transporter.sendMail({
                        from: '"Authentication System" <no-reply@example.com>',
                        to: user.email,
                        subject: "Reset Your Password",
                        html: `
                            <h2>Password Reset Request</h2>

                            <p>Hello ${user.name},</p>

                            <p>Click the button below to reset your password.</p>

                            <a href="${resetLink}"
                            style="
                                    background:#dc3545;
                                    color:white;
                                    padding:12px 20px;
                                    text-decoration:none;
                                    border-radius:5px;">
                                Reset Password
                            </a>

                            <p>This link expires in 1 hour.</p>

                            <p>If you didn't request a password reset, you can safely ignore this email.</p>
                        `
                    });

                    res.render("auth-status", {
                        type: "info",
                        title: "📧 Check Your Email",
                        message: "We've sent you a password reset link.",
                        buttonText: "Back to Login",
                        buttonLink: "/login"
                    });

                }
            );

            // res.send(results);

        }
    );

};

exports.resetPasswordPage = (req, res) => {

    const token = req.params.token;

    db.query(
        "SELECT * FROM users WHERE reset_token = ?",
        [token],
        (error, results) => {

            if (error) {
                console.log(error);
                return res.send("Database Error");
            }

            if (results.length === 0) {
                return res.render("auth-status", {
                    type: "error",
                    title: "⚠ Reset Link Expired",
                    message: "This password reset link is no longer valid.",
                    buttonText: "Forgot Password",
                    buttonLink: "/forgot-password"
                });
            }

            const user = results[0];

            if (user.reset_expires < new Date()) {
                return res.render("auth-status", {
                    type: "error",
                    title: "⚠ Reset Link Expired",
                    message: "This password reset link is no longer valid.",
                    buttonText: "Forgot Password",
                    buttonLink: "/forgot-password"
                });
            }

            res.render("reset-password", {
                token: token
            });

        }
    );

};

exports.resetPassword = async (req, res) => {

    const token = req.params.token;
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.render("reset-password", {
            token: token,
            toast: {
                type: "error",
                title: "Error",
                message: "Passwords do not match."
            }
        });
    }

    db.query(
        "SELECT * FROM users WHERE reset_token = ?",
        [token],
        async (error, results) => {

            if (error) {
                console.log(error);
                return res.send("Database Error");
            }

            if (results.length === 0) {
                return res.render("auth-status", {
                    type: "error",
                    title: "⚠ Reset Link Expired",
                    message: "This password reset link is no longer valid.",
                    buttonText: "Forgot Password",
                    buttonLink: "/forgot-password"
                });
            }

            const user = results[0];

            if (user.reset_expires < new Date()) {
                return res.render("auth-status", {
                    type: "error",
                    title: "⚠ Reset Link Expired",
                    message: "This password reset link is no longer valid.",
                    buttonText: "Forgot Password",
                    buttonLink: "/forgot-password"
                });
            }

            const passwordRegex =
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

            if (!passwordRegex.test(password)) {
                return res.render("reset-password", {
                    token: token,
                    toast: {
                        type: "warning",
                        title: "Weak Password",
                        message: "Password does not meet the required criteria."
                    }

                });
            }
            const hashedPassword = await bcrypt.hash(password, 8);



            db.query(
                `UPDATE users
            SET password = ?,
                reset_token = NULL,
                reset_expires = NULL
            WHERE id = ?`,
                [hashedPassword, user.id],
                (error) => {

                    if (error) {
                        console.log(error);
                        return res.send("Database Error");
                    }

                    res.render("auth-status", {
                        type: "success",
                        title: "Password Updated",
                        message: "🔒 Your password has been updated successfully.",
                        buttonText: "Go to Login",
                        buttonLink: "/login"
                    });

                }
            );

        }
    );
};