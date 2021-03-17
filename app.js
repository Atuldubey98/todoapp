//Definition

const express = require("express");
const port = require("./config").PORT;
const key = require("./config").SECRET_KEY;
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const flash = require('connect-flash');
const session = require("express-session");
//app initialize
const app = express();

// Sql
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "todo",
  password: "Ramatul98#"
});
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

//middleware
// Public Parser
app.use(session({
  secret: key,
  resave: false,
  saveUninitialized: true,
}))
app.use(flash());
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
	extended:false
}))
app.use(bodyParser.json())
// View Engine
app.set('view engine', 'ejs');
app.use(cors());
// requests

app.get("/", (req, res)=>{
	if (req.session.user) {
	var sql = 'SELECT * FROM TODO WHERE USERID = ' + req.session.user.id;

	con.query(sql, (err, result)=>{
		if (err) {
			console.log(err);
		}
			return res.render('pages/index', {title: "TODO", todos : result , user : req.session.user});
		});
	}else{
		req.flash("loginMessage", "Session Expired Login again")
		return res.redirect("/login");
	}
})
app.get("/search/:search", (req, res)=>{
	var sql = "SELECT * FROM TODO WHERE ITEM LIKE '%" + req.params.search + "%'"
	con.query(sql, (err, result)=>{
		if (err) {
			console.log(err);
		}
		if (result == []) {
			res.redirect("/");
		}
		res.render('pages/index', {title: "TODO", todos : result, user : req.session.user});
	});
})



app.post("/",(req, res)=>{
	const item = req.body.item;
	const user = req.session.user.id;
	var sql = 'INSERT INTO TODO(ITEM, USERID) values ?';
	const values = [
		[item, user]
	];
	if (!user) {
		req.flash("loginMessage", "Session Expired Login again");
		return res.redirect("/login");
	}
	con.query(sql, [values], (err, result)=>{
		if (err) {
			throw err;
		}
		console.log(result.insertId);
		return res.status(200).json({
			id : result.insertId,
			item: item
		});
	})
})

app.get("/delete/:id", (req, res)=>{
	const id = req.params.id;
	var sql = 'DELETE FROM TODO WHERE ID=' + id;
	con.query(sql, (err, result)=>{
		if (err) {
			throw err;
		}
		return res.status(200).json({
			status : "ok",
			id : id,
			message : "DELETE"
		});
	})
})
// Login POST
app.post("/login", (req, res)=>{
	var sql = "SELECT * FROM USERS WHERE EMAIL=?";
	var value = req.body.email;
	con.query(sql, value, (err, result)=>{
		if (err) {throw er;}
		if (result.length > 0) {
			if (result[0].password != req.body.password) {
				req.flash("loginMessage", "Password Authentication failed")
				return res.redirect("/login");
			}else {
				if (!req.session.user) {
							req.session.user = result[0];
						}
						else{
							req.session.user = result[0];
				}
				return res.redirect("/");
			}
		}
	});
})

// Loging GET
app.get("/login",(req, res)=>{
	return res.render("pages/login", {title : "Login TODO", message : req.flash("loginMessage")});
})

// Register GET
app.get("/register",(req, res)=>{
	return res.render("pages/register", {title : "Register TODO", message : req.flash("registerMessage")});
})

//Logout User
app.get("/logout" , (req, res)=>{
	req.session.user = {};
	return res.redirect("/login");
})

app.post("/register", (req, res)=>{
	const user=req.body;
	if (typeof user.name == undefined || typeof user.email == undefined || typeof user.password == undefined|| user.name.length < 3 || user.email.length < 3 || user.password.length < 3) {
		req.flash("registerMessage", "Enter Valid Fields");
		return res.redirect("/register");
	}else{
		var check = "SELECT * FROM USERS WHERE email=" + '"' + user.email + '"';
		con.query(check, (err, result)=>{
			if (err) {
				throw err;
			}else {
				if (result.length >0) {
					req.flash("registerMessage", "The Email Already Exist");
					return res.redirect("/register");
				}else{
					var sql = "insert into users(name, email, password) values ?";
					var values = [
						[user.name, user.email, user.password]
					];
					con.query(sql,[values], (err, resul)=>{
						if (err) {
							throw err;
						}
						return res.redirect("/login");
					})
				}
			}
		})
	}
})
app.listen(port, "0.0.0.0");