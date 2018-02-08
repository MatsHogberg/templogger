var Promise = require("rsvp").Promise;
var schedule = require("node-schedule");
var mongo = require('mongodb');
var mongoClient = require("mongodb").MongoClient;
var request = require("request");

var secrets = require("./secrets");
// mongodb 3.4
var dbUrl = secrets.secret.dbConnectionString; // "mongodb://weatheradmin:haga280@weathercluster-shard-00-00-dobbb.mongodb.net:27017/temperature?ssl=true&authSource=admin";
var weatherApiKey = secrets.secret.weatherApiKey; //"aad118cf783212643c937f267735537c";
var lon = 11.603785;
var lat = 58.132253;
var weatherUrl = "http://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon + "&APPID=" + weatherApiKey + "&units=metric";

console.log(new Date().toISOString());
var job = schedule.scheduleJob("0 * * * *", function(){callGetTemp(weatherUrl, dbUrl);});

// callGetTemp(weatherUrl, dbUrl);

function callGetTemp(weatherUrl, dbUrl) {
    getTemp(weatherUrl).then(function (weather) {
        var weatherData = JSON.parse(weather);
        var temp = weatherData.main.temp;
        console.log("Temp: " + temp);

        openDatabase(dbUrl).then(function(outdoorCollection){
            addTempReading(outdoorCollection, temp).then(function(ok){
                console.log("Insert done.");
            },
            function(fail){
                console.log("Insert failed: " + fail);
            });
        }, function(err){
            console.log("Error opening database")
        });

    }, function (err) {
        console.log("Error getting weather: " + err);
    });
}

function addTempReading(col, temp){
    return new Promise(function(resolve, reject){
        col.insertOne({"temp": temp, "time": new Date().toISOString()}, function(err, result){
            if(err){
                reject(err);
            }else{
                resolve(true);
            }
        })
    });
}

function openDatabase(url) {
    return new Promise(function(resolve, reject){
        mongoClient.connect(url, function(err, database){
            if(err){
                throw(err);
                reject(err);
            }else{
                const myDb = database.db("temperature");
                resolve(myDb.collection("outdoor"));
            }
        });
    });
};
function getTemp(weatherUrl) {
    return new Promise(function (resolve, reject) {
        request(weatherUrl, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                resolve(body);
            } else {
                reject(error);
            }
        })
    });
};
