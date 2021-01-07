//jshint esversion:6
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require('mongoose');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const findOrCreate = require('mongoose-findorcreate');
const fileUpload = require('express-fileupload');

let searchname=[];
let searchID=[];
let notFound;


app.use(fileUpload());
app.use(bodyParser.urlencoded({
  extended: true
})); //to use bodyParser we have to use it;
app.use(express.static("public"));
app.set('view engine', 'ejs');

app.use(session({ //for express-session we are creating session
  secret:process.env.SECRET,
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize()); //passport initialization
app.use(passport.session()); //passport session create

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});//connection mongoose
mongoose.set("useCreateIndex", true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({ //defining what will be there in the database
  username: String,
  password: String,
  googleId: String,
});
const productSchema = new mongoose.Schema({
  book_name: String,
  author_Name: String,
  book_price: Number,
  book_details: String,
  image: String,
  userid: String,
  comment: [String],
});

  const commentSchema=new mongoose.Schema({
    comment:String,
    productID:String,
    user:String,
  });

  const buy_SellSchema=new mongoose.Schema({
    sellerid:String,
    buyerid:String,
    bookname:String,
    price:String,
    buyername:String,
    mobileNumberOfBuyer:String,
    Homeaddress:String,
    Shipped:String,
  });


const messageSchema=new mongoose.Schema({
   buy_sell_id:String,
   username:String,
   message:String,
});


userSchema.plugin(passportLocalMongoose); //to use passportLocalMongoose
userSchema.plugin(findOrCreate);
const Message=new mongoose.model("Message",messageSchema);
const Buy_sell=new mongoose.model("Buy_sell",buy_SellSchema);
const Comment=new mongoose.model('CommentDB',commentSchema);
const User = new mongoose.model('UserDB', userSchema);
const Product = new mongoose.model('ProductDB', productSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/ignosi",
    userProfileUrl: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      googleId: profile.id,
      username: profile.displayName
    }, function(err, user) {
      return cb(err, user);
    });
  }
));




app.get("/", function(req, res) {
  res.render("home");
});



app.get("/userlogin", function(req, res) {
  res.render("userlogin");
});



app.get("/sellerlogin", function(req, res) {
  res.render("sellerlogin");
});



app.get("/userregister", function(req, res) {
  res.render("userregister");
});



app.get("/sellerregister", function(req, res) {
  res.render("sellerregister");
});



app.get("/success", function(req, res) {
  if (req.isAuthenticated()) {
    Product.find({}, function(err, result) {
      const number = result.length;
      console.log(number);
      res.render("next", {
        found: result,
        findFiles: number
      });
    });
  } else {
    res.redirect("/userlogin");
  }
});



app.get("/auth/google",
  passport.authenticate('google', {
    scope: ['profile']
  }));
app.get("/auth/google/ignosi",
  passport.authenticate('google', {
    failureRedirect: '/userlogin'
  }),
  function(req, res) {
    res.redirect('/success');
  });




app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});




app.post("/userregister", function(req, res) {
  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/userregister");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/success");
      });
    }
  });
});




app.post("/userlogin", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/success");
      });
    }
  });
});




app.get("/fileUpload", function(req, res) {
  if (req.isAuthenticated()) {
    const currentUser = req.user.googleId;
    res.render("fileUpload", {
      userId: currentUser
    });
  } else {
    res.redirect("/userlogin");
  }
});

app.post("/Upload", function(req, res) {
  const bookName = req.body.bookName;
  const bookAuthor = req.body.bookAuthor;
  const price = req.body.price;
  const bookDetals = req.body.bookDetals;
  const userId = req.user._id;
  console.log("user id:" + userId);
  let image = req.files.imgUpload;
  let imageName = image.name;

  image.mv("./public/images/" + imageName, function(err) {
    if (err) {
      res.send(err);
    }
  });

  const product = new Product({
    book_name: bookName,
    author_Name: bookAuthor,
    book_price: price,
    userid: userId,
    book_details: bookDetals,
    image: "/images/" + imageName,
  });
  product.save();
  res.redirect("/success");
});



app.get("/dashboard", function(req, res) {
  if (req.isAuthenticated()) {
    const currentUser = req.user._id;
    console.log(currentUser);
    Product.find({
      userid: currentUser
    }, function(err, result) {
      User.findOne({
        _id: req.user._id
      }, function(err, thing) {
        Buy_sell.find({sellerid:req.user._id},function(err,bcd){
          Buy_sell.find({buyerid:req.user._id},function(err,abc){
            res.render("dashboard", {
              found: result,
              all: thing,
              sell:bcd,
              buy:abc,
            });
          });
        });
      });
    });

  } else {
    res.redirect("/userlogin");
  }
});


app.get("/aboutbook/:bookId", function(req, res) {
  let bookID = req.params.bookId;
  if (req.isAuthenticated()) {
    userid=req.user._id;

  Product.find({_id:bookID},function(err,found){
    Comment.find({productID:bookID},function(err,result){
        res.render("bookAbout",{
          list:found,
          currentid:userid,
          comnt:result,
        });
    });
  });
    // Product.find({
    //   _id: bookID
    // }, function(err, result) {
    //   const userid = req.user._id;
    //
    //   res.render("bookAbout", {
    //     list: result,
    //     currentid: userid
    //   });
    // });
  } else {
    res.redirect("/userlogin");
  }
});

app.post("/aboutbook", function(req, res) {
  if (req.isAuthenticated()) {
  let comm = req.body.comment;
  let product = req.body.prd;
  let userid = req.user.username;
   // User.find({
   //   _id:userid
   // },function(err,result){
   //   console.log(result);
     const com1=new Comment({
       comment:comm,
       productID:product,
       user:userid,
     });
     com1.save();
   // });

  // Product.findOneAndUpdate({
  //   _id: product
  // }, {
  //   push: {
  //     comment:comm
  //   }
  // }, function(err, success) {
  //   if (!err) {
  //     console.log("added successfully");
  //   }
  // });
  res.redirect("/aboutbook/" + product);
}else {
  res.redirect("/userlogin");
}

});



app.post("/remove",function(req,res){
     let rmv=req.body.rmbButton;
    Product.findByIdAndRemove(rmv,function(err,result){
      if(!err){
        console.log("deleted successfully");
        res.redirect("/success");
      }
    });
});
app.get("/buy/:product",function(req,res){
  if (req.isAuthenticated()) {
  let item=req.params.product;
  Product.find({_id:item},function(err,result){
    let user=req.user._id;
    res.render("buy",{
       buyer:user,
       product:result,
    });
  });
}else{
    res.redirect("/userlogin");
}
});




app.get("/sellrequest",function(req,res){

  if (req.isAuthenticated()) {
  const id=req.user._id;
  Buy_sell.find({sellerid:id},function(err,result){
    res.render("sellrequest",{
       found:result,
    });
  });
  }else{
    res.redirect("/userlogin");
  }
});

app.get("/buyerpage",function(req,res){
  if (req.isAuthenticated()) {
  const id=req.user._id;
  Buy_sell.find({buyerid:id},function(err,result){
    res.render("sellrequest",{
       found:result,
    });
  });
  }else{
    res.redirect("/userlogin");
  }
});

app.post("/order",function(req,res){
    if (req.isAuthenticated()) {
     const seller=req.body.sellerid;
     const buyer=req.body.buyerid;
     const bookName=req.body.bookname;
     const price=req.body.price;
     const buyername=req.body.buyerNAme;
     const buyerMobileNumber=req.body.buyerMobileNumber;
     const address=req.body.Address;


     const buysell=new Buy_sell({
       sellerid:seller,
       buyerid:buyer,
       bookname:bookName,
       price:price,
       buyername:buyername,
       mobileNumberOfBuyer:buyerMobileNumber,
       Homeaddress:address,
     });
     buysell.save();
     res.redirect("/success");
   }else{
       res.redirect("/userlogin");
   }
});

app.post("/delivered",function(req,res){


  if (req.isAuthenticated()) {
      const id=req.body.sellid;
      const delivered=req.body.delivered;
    Buy_sell.findByIdAndUpdate(id, { Shipped: delivered },function(err){
      if(!err){
        console.log("successful");
      }
    });
    res.redirect("/sellrequest");
}else{
  res.redirect("/userlogin");
}
});


app.get("/message/:something",function(req,res){
      let ad=req.params.something;
      if (req.isAuthenticated()) {
      Buy_sell.find({_id:ad},function(err,result){
        let user=req.user._id;
        if((user==(result[0].sellerid))||(user==(result[0].buyerid))){
          User.find({_id:user},function(err,ok){
            Message.find({buy_sell_id:ad},function(err,found){
              if(!err){
                res.render("message",{
                      message :found,
                      Sell:result,
                      rs:ok,
                });
              }
            });
          });
        }else{
          res.redirect("/success");
        }
      });
     }else{
      res.redirect("/userlogin");
    }
});


app.post("/message",function(req,res){
  if (req.isAuthenticated()) {
     const msg=req.body.msg;
     let usname=req.body.username;
     let sellpostid=req.body.sellpostid;

     const message=new Message({
       buy_sell_id:sellpostid,
       username:usname,
       message:msg,
     });
     message.save();
     res.redirect("/message/"+sellpostid);
  }else{
   res.redirect("/userlogin");
 }
});

app.post("/search",function(req,res){
  searchname=[];
  searchID=[];
  notFound=null;
  let search=req.body.search;
  console.log(search);
   Product.find({book_name:{ $regex: '.*' + search + '.*',$options: 'i'} },
   function(err,data){
     if(data.length>0){
        data.forEach(function(item){
             searchname.push(item.book_name);
             searchID.push(item._id);
             res.redirect("/search");
        });
      }else{
        notFound="not found";
         res.redirect("/search");
      }
  });
});

app.get("/search",function(req,res){
    if (req.isAuthenticated()) {
    res.render("search",{
      Name:searchname,
       Id:searchID,
         no:notFound,
    });
  }else{
   res.redirect("/userlogin");
 }
});

app.listen(3000||process.env.PORT, function(req, res) {
  console.log("connected to port 3000");
});
