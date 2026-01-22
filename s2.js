var cookieparser = require('cookie-parser');
var csrf = require('csurf');
var bodyparser = require('body-parser');
var express = require('express');
var csrfprotection = csrf({cookie:true})
var parseform = bodyparser.urlencoded({extended:false});
var app = express();

app.set("view engine", "ejs");
app.use(cookieparser());

app.get('/form',csrfprotection,function(req,res){
    res.render('t2.ejs',{csrftoken: req.csrfToken()})
})

app.post('/process',parseform,csrfprotection,function(req,res){
    res.send('got the data safe')
})

app.listen(4000);