const path = require("path");
const express = require("express");
const { error } = require("console");

const multer = require('multer');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//built in middleware : static

//types of middle ware : app, router, error, built in , third party
// const reqfilter = (req, res, next) => {
//     const age = req.query.age;

//     if (!age) {
//         return res.send("Please enter your age in the URL ?age=");
//     }

//     next();
// };

// var router1 = express.Router();
// var router2  = express.Router();

// const vlog1 = function(req,res,next)
// {
//     console.log("welcome to vlog1");
//     next()
// }

// const vlog2 = function(req,res,next)
// {
//     console.log("welcome to vlog2");
//     next()
// }



app.get("/", (req, res) => {
    res.render('try');
});

app.get("/form", (req, res) => {
    res.render('try');
});

// app.get('/fsd2',(req,res,next)=>{
//     fsPromises.get
// })

// var rerr = function(err,req,res,next)
// {
//     console.error(err.stack);
//     console.log(err);
//     res.status(500).send('something broke!');
//     res.render('')

// }

// app.use((error,req,res,next)=>{
//     console.log("error middle ware is called");
//     console.log("path: ," , req.path);
//     console.error('error: ',error);

//     if(error.type == 'redirect')
//     {
//         res.redirect('/error')
//     }
//     else if(error.type == 'time out')
//     {
//         res.status(400).send(error);
//     }
//     else
//     {
//         res.status(500).send(error)
//         next()
//     }
// })

// app.use(err);

const filestorage = multer.diskStorage({
destination: (req,res, cb) =>{
    cb(null, "./images");
},
filename: (req,file,cb) =>{
    cb(false, Date() + " : " + file.originalname);
},
});

const upload = multer({storage: filestorage});

// Array to store submissions
let submissions = [];

app.post('/single',(req,res)=>{
    const submission = {
        courseName: req.body.courseName,
        name: req.body.name,
        roll: req.body.roll,
        expectations: req.body.expectations,
        file: req.file ? req.file.filename : 'No file'
    };
    
    submissions.push(submission);
    console.log("Submission saved:", submission);
    
    res.redirect('/submissions');
});

app.get('/submissions', (req, res) => {
    res.render('two', { submissions: submissions });
});

app.listen(3000, () => console.log("Server running on port 3000"));
