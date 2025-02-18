const path = require("path");
const http = require('http')

const express = require("express");
const router = express.Router();

const app = express();

app.use(express.static('public'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



app.get('/', (req, res) => {
    res.render('landing_page');
});

app.listen(3000, () => console.log("Server running on port 3000"));

