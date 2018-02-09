var Promise = require("rsvp").Promise;
var schedule = require("node-schedule");
var mongo = require('mongodb');
var mongoClient = require("mongodb").MongoClient;
var request = require("request");

var secrets = require("./secrets");
// mongodb 3.4
var dbUrl = secrets.secret.dbConnectionString; 
var weatherApiKey = secrets.secret.weatherApiKey;
var urlFor90000 = secrets.secret.saveWeather;
var keyFor90000 = secrets.secret.saveKey;
var lon = 11.603785;
var lat = 58.132253;
var weatherUrl = "http://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon + "&APPID=" + weatherApiKey + "&units=metric";

console.log(new Date().toISOString());
var job = schedule.scheduleJob("0 * * * *", function(){callGetTemp(weatherUrl, dbUrl);});
var oldReading = 0;

/**
 * Main function that's called every hour on the hour
 * @param {string} weatherUrl - The URL to the weather API
 * @param {string} dbUrl - The URL to the Atlas DB 
 */
function callGetTemp(weatherUrl, dbUrl) {
    getTemp(weatherUrl).then(function (weather) {
        var weatherData = JSON.parse(weather);
        var temp = weatherData.main.temp;
        var tajm = new Date().toISOString();
        var dbData = {
            "temp": temp,
            "time": tajm
        };
        oldReading = temp;

        console.log("Temp: " + temp + "\r\nTime: " + tajm);

        var fullUrl90000 = format90000Url(urlFor90000,keyFor90000, temp);
        saveTempTo90000(fullUrl90000);

        openDatabase(dbUrl).then(function(outdoorCollection){
            addTempReading(outdoorCollection, dbData).then(function(ok){
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

function format90000Url(baseUrl, key, temp){
    return baseUrl + "key=" + key + "&temp=" + temp + "&loc=ute";
}

function saveTempTo90000(url){
    request(url, function(error, response, body){
        if(!error && response.statusCode === 200){
            console.log("Saved to 90000");
        }else{
            console.log("Error saving to 90000: " + body);
        }
    });
}

/**
 * Stores a new row in a collection
 * @param {db collection} col - The collection to which to add the data
 * @param {json object} dbData - The data to add to the collection. 
 */
function addTempReading(col, dbData){
    return new Promise(function(resolve, reject){
        col.insertOne(dbData, function(err, result){
            if(err){
                reject(err);
            }else{
                resolve(true);
            }
        })
    });
}

/**
 * Opens a connection to the Atlas DB and returns the collection named 'outdoor' in the db 'temperature'
 * @param {string} url - The URI to the Mongo Atlas DB
 */
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

/**
 * Fetches weather data from OPenWeather
 * @param {string} weatherUrl - The URL (incl APPKEY) to the weather service 
 */
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
