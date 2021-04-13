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


// Socket
const server = require('http').createServer(app);
const io = require('socket.io')(server);
io.on('connection', (Socket) => {
	console.log("Received Connection");
	Socket.on('message', msg => {
		const chat = {
			message: msg.message,
			from : msg.from,
			to : msg.to,
			chatid: msg.chatid,
		}
		var sql = `INSERT INTO MESSAGES (message, from_id, to_id, chat_id) values ?`;
		var values = [
			[msg.message, msg.from, msg.to, msg.chatid]
		];
		con.query(sql,[values], (err, result)=>{
			if (err) {
				throw err;
			}else{
				io.emit("getMessage",msg);
			}
		})
  });
});

// Sql
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "todo",
  password: key
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

//Index page
app.get("/", (req, res)=>{
	if (req.session.user) {
		var sql = 'SELECT * FROM TODO WHERE USERID = ' + req.session.user.id;
		console.log(req.session.user.id);
		con.query(sql, (err, result)=>{
			if (err) {
				console.log(err);
			}
				return res.render('pages/index', {title:"TODO",
													 todos : result , user : req.session.user});
			});
	}else{
		req.flash("loginMessage", "Session Expired Login again")
		return res.redirect("/login");
	}
})

//Search a todo
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

//Post a todo;

app.post("/",(req, res)=>{
	const item = req.body.item;
	
	if (!req.session.user) {
		req.flash("loginMessage", "Session Expired Login again");
		return res.redirect("/login");
	}
	const user = req.session.user.id;
	var sql = 'INSERT INTO TODO(ITEM, USERID) values ?';
	const values = [
		[item, user]
	];
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

// delete a todo;
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

// regsiter user
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
						req.flash("loginMessage", "User Created Register to Login");
						return res.redirect("/login");
					})
				}
			}
		})
	}
})

// CHATS get

app.get("/chats", (req, res)=>{
	
	if (req.session.user) {
		var sql = `select name , id from users where id in (select contactid from contacts where userid = ` + req.session.user.id + `)`;
		con.query(sql, (err, contacts)=>{
			if (err) {
				throw err;
			}
			return res.render('pages/chats', {chatnames : contacts, user: req.session.user, title: "TODO"})
		})
	}else{
		req.flash("loginMessage", "Login again session expired")
		return res.redirect('login');
	}
})

// chat get by User

app.get("/chats/:id", (req, res)=>{
	if (req.session.user && typeof req.params.id != undefined && req.params.id != "") {	
		var sql = "SELECT * FROM MESSAGES WHERE chat_id = " + req.params.id;
		con.query(sql, (err, chats)=>{
			if (err) {
				throw err;
			}
			console.log(chats);
			return res.status(200).json({
				chats: chats
			});
		})
	}
	else {
		req.flash("loginMessage", "Login again session expired")
		return res.redirect('/login');	
	}
})

app.get("/users/:search", (req,res)=>{
	
	var sql = "SELECT name, email, id FROM USERS WHERE name or email LIKE '%" + req.params.search + "%'" + "limit 10";
	con.query(sql, (err, users)=>{
		if (err) {throw err;}
		if (req.session.user) {
			return res.
			render('pages/users', {users: users.filter(user=> user.id != req.session.user.id), title : "USERS", user: req.session.user});
		}else{
			return res.redirect('/login')
		}
	})
	
})

app.get('/createchat/:contactid', (req, res)=>{
	if (req.session.user) {
		const sql = `SELECT * FROM CONTACTS WHERE CONTACTID = ? and USERID = ?`
		con.
		query(sql,[req.session.user.id, req.params.contactid],
		 (err, result)=>{
		
			if (result.length > 0) {
				return res.
				status(200).
				json({status: "notok", result : result});
			}else{
				const inContacts = `insert into contacts (contactid, userid) values ?`;
				const values = [
					[req.params.contactid, req.session.user.id],
					[req.session.user.id, req.params.contactid]
				];
				con.query(inContacts,[values], (err, resu)=>{
					if (err) {
						throw err;
					}
					return res.
					status(200).
					json({status : "ok", result: resu});
				})
			}
		})
	}else{
		res.redirect('login');
	}
})


//Listen to server
server.listen(port, "0.0.0.0");