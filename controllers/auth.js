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
               return res.render("verification-failed");
            }

            const user = results[0];

        if (user.is_verified) {
            // return res.render("verification-success", {
            //     message: "Your email is already verified."
            // });
                return res.render("auth-status", {
                type: "success",
                icon: "✔",
                title: "Email Verified",
                message: "Your email has been verified successfully.",
                buttonText: "Login",
                buttonLink: "/login"
            });
        }

        if (user.verification_expires < new Date()) {
            return res.render("verification-failed");
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

        // res.render("verification-success");
                    res.render("auth-status", {
            type: "success",
            title: "🎉Email Verified",
            message: "Your email has been verified successfully.",
            buttonText: "Login",
            buttonLink: "/login"
        });
    }
);;

        }
    );

};

exports.register = (req,res)=>{
    console.log(req.body);

    const {name, email , password , Confirm_password } = req.body;

    db.query('select email from users where email = ?',[email], async (error,result) => {
       if(error){
        console.log(error);
       }
       if(result.length>0){
        return res.render("register",{
            message:'That email is already in use '
        });
       } else if( password !== Confirm_password){
         return res.render("register",{
            message:'Password does not match '
        });
       };

         const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

        if (!passwordRegex.test(password)) {
            return res.render("register", {
                message:
                "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character."
            });
        }

        let hashPassword = await bcrypt.hash(password,8);
        
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

                const verificationLink = `http://localhost:5000/auth/verify/${verificationToken}`;

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
                    message: "User registered successfully. Please verify your email."
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
                    message: "Server Error"
                });
            }

            if (results.length === 0) {
                return res.render("login", {
                    message: "Email not found"
                });
            }

            const user = results[0];

            const isMatch = await bcrypt.compare(
                password,
                user.password
            );

            if (!isMatch) {
                return res.render("login", {
                    message: "Incorrect Password"
                });
            }

            if (!user.is_verified) {
            return res.render("login", {
                message: "Please verify your email before logging in."
                });
            }

            console.log(process.env.JWT_SECRET);

            // Generate JWT Token
            const token = jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            );

            console.log("Token:", token);

            res.cookie("jwt", token, {
                httpOnly: true
            });

            res.redirect("/dashboard");
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
                return res.send("No account found with this email.");
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

                    const resetLink = `http://localhost:5000/auth/reset-password/${resetToken}`;

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

                    // res.send("Password reset email sent successfully.");
                    res.render("reset-email", {
                        message: "Password reset email sent successfully."
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
                return res.send("Invalid reset link.");
            }

            const user = results[0];

            if (user.reset_expires < new Date()) {
                return res.send("Reset link has expired.");
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
            token,
            message: "Passwords do not match."
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
            return res.send("Invalid reset link.");
        }

        const user = results[0];

        if (user.reset_expires < new Date()) {
            return res.send("Reset link has expired.");
        }

        const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

        if (!passwordRegex.test(password)) {
            return res.render("reset-password", {
                message:
                "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character."
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);



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

                res.redirect("/login");

            }
        );

    }
);
};