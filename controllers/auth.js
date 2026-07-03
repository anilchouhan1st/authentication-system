const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


const db = require("../db");

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

        let hashPassword = await bcrypt.hash(password,8);
        console.log(hashPassword);

        db.query('insert into users set ?',{name: name,email:email ,password: hashPassword},(error,result)=>{
            if(error){
                console.log(error);
            } else{
                console.log(result);
                 return res.render("register",{
            message:'User register '
        });
            }
        })
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
