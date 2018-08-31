'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
// Standard URI format: mongodb://[dbuser:dbpassword@]host:port/dbname, details set in .env
var MONGODB_URI = 'mongodb://'+process.env.USER+':'+process.env.PASS+'@'+process.env.HOST+':'+process.env.DB_PORT+'/'+process.env.DB;
mongoose.Promise = global.Promise //for deprication warning
mongoose.connect(MONGODB_URI, { useMongoClient: true })
  .then(() =>  console.log('mLab connection succesful'))
  .catch((err) => console.error(err))

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/public', express.static(process.cwd() + '/public'));

//include models
const Url = require('./models/url')


app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


// route to recieve form request... 
app.post("/api/shorturl/new", function (req, res) {
  //check if url alreadu exists
  Url.findOne({originalUrl: req.body.url}).exec()
  .then(urls => {
    if(urls){
      return res.json({
        original_url: urls.originalUrl,
        short_url: urls.shortUrl
      })
    }else{
      // validate url
      var reg = /^(http[s]?:\/\/){1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/;
      if (!reg.test(req.body.url)) { 
          return res.json({error: 'invalid URL'});
       }
      var inUrl = req.body.url
      var onlyUrl = inUrl.hostname + inUrl.pathname
          // console.log(onlyUrl)
      //validate valid hostname
      dns.lookup(onlyUrl, function (err, addresses) {
        // console.log(err)
        if(err){
          res.json({error: 'invalid Hostname'});
        }else{
          Url.count(function(err, count){
              console.log("Number of docs: ", count );
            var total = count + 1
            // return res.send(total)
            const shortUrl = new Url({
              _id: new mongoose.Types.ObjectId(),
              originalUrl: req.body.url,
              shortUrl: total
            })

            shortUrl.save().then(
              result => {
                res.json({
                  original_url: result.originalUrl,
                  short_url: result.shortUrl
                })
              }).catch(err => {
                  res.json({
                    error: err
                  })
              })
          })
        }

      })

    }
  })
  
  
});

// route to redirect short url to main url... 
app.get("/api/shorturl/:short", function (req, res) {
  //check short url type is number
  var isNum = /^\d+$/.test(req.params.short)

  if(!isNum){
    res.json({ error: 'Wrong Format' })
  }else{
    var shortNum = Number(req.params.short)
    Url.findOne({ shortUrl: shortNum}, (err, doc) => {
    if(err){
      return res.json({
          error: err
        })
      }
      if(doc){
        res.redirect(doc.originalUrl)
      }else{
        res.json({ error: 'Shortlink not found in the database.' })
      }
    }) 
   }
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});