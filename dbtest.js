var mongo = require('mongodb');
var mongoClient = require("mongodb").MongoClient;
var dbUrl = "mongodb://weatheradmin:haga280@weathercluster-shard-00-00-dobbb.mongodb.net:27017/temperature?ssl=true&authSource=admin";
var myCollection;
mongoClient.connect(url, function(err, db){
    if(err){
        console.log(err);
    }else{
        console.log("Connected");
        myCollection = db.Collection("outdoor");
    }
});
