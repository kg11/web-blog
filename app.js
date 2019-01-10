var express=require("express");
var app=express();
var bodyParser=require("body-parser");
var passport= require("passport");
var LocalStrategy= require("passport-local");
var User= require("./models/user");
var mongoose =require("mongoose");
var methodoverride=require("method-override");

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//app cogig
mongoose.connect("mongodb://localhost/restfullblog");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(methodoverride("_method"));

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   next();
});

//mongoose config
var blogschema = new mongoose.Schema({
    name: String,
    author:String,
    image: String,
    body: String,
    created: { type:Date, default:Date.now} 
});

var blog= mongoose.model("blog",blogschema);

//restfull-routes
app.get("/",function(req,res){
   res.render("home"); 
});


app.get("/blogs",isLoggedIn,function(req,res){
   blog.find({},function(err,blogs){
       if(err){
           console.log(err);
       }
       else{
           res.render("index",{blogs:blogs});
       }
   }) ;
});

//create route
app.get("/blogs/new",isLoggedIn,function(req, res) {
    res.render("new");
})

app.post("/blogs",function(req,res){
    blog.create(req.body.blog,function(error,newblog){
        if(error){
            res.render("new");
        }
        else{
            res.redirect("/blogs");
        }
    })    
})

//show route
app.get("/blogs/:id",isLoggedIn,function(req, res) {
    blog.findById(req.params.id,function(error,foundblog){
        if(error){
            res.redirect("/blogs");
        }
        else{
            res.render("show",{blogs:foundblog});
        }
    })
})

//edit route
app.get("/blogs/:id/:author/edit",isLoggedIn,function(req, res) {
    if(req.params.author==res.locals.currentUser.username)
    {
    blog.findById(req.params.id,function(error,foundblog){
        if(error){
            res.redirect("/blogs");
        }
        else{
            res.render("edit",{blogs:foundblog});
        }
    });
    }
    else{
         res.render("nodelete");
    }
});

//update route
app.put("/blogs/:id",function(req,res){
    blog.findByIdAndUpdate(req.params.id,req.body.blog,function(error,updatedblog){
        if(error){
            res.redirect("/blogs");
        }
        else{
            res.redirect("/blogs/"+req.params.id);
        }
    })
})

// DELETE ROUTE
app.delete("/blogs/:id/:author", function(req, res){
   console.log(req.params.author);
   console.log(res.locals.currentUser.username);
   if(req.params.author==res.locals.currentUser.username){
   blog.findByIdAndRemove(req.params.id, function(err){
      if(err){
          res.redirect("/blogs");
      } else{
          res.redirect("/blogs");
      }
   });
   }
   else{
       res.render("nodelete");
   }
});


// show register form
app.get("/register", function(req, res){
   res.render("register"); 
});

//handle sign up logic
app.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
            res.render("login");
        });
    });
});

app.get("/login", function(req, res){
   res.render("login"); 
});
// handling login logic
app.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/blogs",
        failureRedirect: "/login"
    }), function(req, res){
});

// logic route
app.get("/logout", function(req, res){
   req.logout();
   res.redirect("/blogs");
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

app.listen(process.env.PORT,process.env.IP,function(){
    console.log("server has started");
});