var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var url = require('url');
var http = require('http');
var WebSocket = require('ws');
var CryptoJS = require ('crypto-js');
var key = "mykey";

var MongoClient = require('mongodb').MongoClient;
var dbUrl = "mongodb://127.0.0.1:27017/local";
var xacnhan = false;
var auth = "normal"
var server = http.createServer(app);
var ws = new WebSocket.Server({ server });

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.set('port', process.env.PORT || 3000);

app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static(__dirname + '/views'));


app.get("/home", function (req, res) {
    xacnhan=false;

    res.render("index");
});
app.get("/", function (req, res) {
  if(xacnhan==true){
    if(auth =="admin"){
      res.render("control.ejs");
    }
    else{
      res.send("you are normal!!")
    }
  }
    
    //res.send(req.body)
  
  else
  {
    res.redirect("/home");
  }
});

app.post("/home", function (req, res) {
    let user = {
        name: req.body.username,
        password: req.body.password
    }  
    
    MongoClient.connect(dbUrl, function(err, db) {
      if (err) throw err;
      
      db.collection("users").findOne({name: user.name}, (function(err, result) {
        if (err) throw err;
      if (result ==null)
       {
        res.redirect("/register")
       }
       else
        {let dpass = CryptoJS.AES.decrypt(result.password,'key').toString(CryptoJS.enc.Utf8);
      //console.log("Pass ma hoa:" + dpass);
        if( dpass == user.password)
        {
            res.render("home", { name: user.name, role: result.role});
            xacnhan=true;
            auth = result.role;
        }
        else {
          res.redirect("/register");
        }
        }
        //console.log(result);
        db.close();
      }))
    });
    
});

app.get("/register", function(req, res){
    res.render("sign-up.ejs");
});

app.post("/register",function(req, res){
    var mahoa = CryptoJS.AES.encrypt(req.body.password, 'key').toString();
    let user = {
        name: req.body.username,
        password: mahoa,
        role: "normal"
    }  

    MongoClient.connect(dbUrl, function(err, db) {
        if (err) throw err;
        
        db.collection("users").insertOne(user, function(err, res) {
          if (err) throw err;
          console.log("1 user added");
          db.close();
        });
      });

      res.send("Regiter completed "+ user.name);
})

var clients = [];
function broadcast(socket, data) {
console.log(clients.length);
for(var i=0; i<clients.length; i++) {
if(clients[i] != socket) {
clients[i].send(data);
}
}
}
ws.on('connection', function(socket, req) {
clients.push(socket);
socket.on('message', function(message) {
console.log('received: %s', message);
if(message=='out')
{
  xacnhan = false;
}
else
broadcast(socket, message);
});
socket.on('close', function() {
var index = clients.indexOf(socket);
clients.splice(index, 1);
console.log('disconnected');
});
});

server.listen(app.get('port'));
console.log('Server listening on port 3000');