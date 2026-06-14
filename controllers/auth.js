const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


const db = mysql.createConnection({
    host:process.env.DATABASE_HOST,
    user:process.env.DATABASE_USER,
    password:process.env.DATABASE_PASSWORD,
    database:process.env.DATABASE
});


exports.register = (req,res)=>{
    console.log(req.body);

    const {name, email , password , Confirm_password } = req.body;

    db.query('select email from records where email = ?',[email], async (error,result) => {
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

        db.query('insert into records set ?',{name: name,email:email ,password: hashPassword},(error,result)=>{
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
        "SELECT * FROM records WHERE email = ?",
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
