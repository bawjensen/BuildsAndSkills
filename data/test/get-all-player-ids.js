/*

NOTES:

- Getting all challengers, then their match histories, then making a map of champ -> masteries array and map of champ -> runes array


--- IGNORE BELOW --- (the data already exists in data dump from ddragon [http://ddragon.leagueoflegends.com/cdn/dragontail-4.21.4.tgz])
- Side data:
    - Gotta create mastery -> relevant info obj
        - Relevant info: Image, text, ranks, title
    - Gotta create champ -> relevant info
        - Relevant info: Image, title
--- IGNORE ABOVE ---

*/


var fs          = require("fs"),
    logfmt      = require("logfmt"),
    MongoClient = require('mongodb').MongoClient,
    request     = require("request"),
    querystring = require("querystring");

var MONGO_URL = 'mongodb://bawjensen:dummypass@ds031531.mongolab.com:31531/heroku_app33050572';

var KEY = '81216707-de8d-4484-9d08-619de3821271';
var KEY_QUERY = querystring.stringify({ api_key: KEY });

var API_BASE_URL            = 'https://na.api.pvp.net';
var MATCH_HISTORY_ROUTE     = '/api/lol/na/v2.2/matchhistory/';
var LEAGUE_DATA_ROUTE       = '/api/lol/na/v2.5/league/by-summoner/';
var MATCH_ROUTE             = '/api/lol/na/v2.2/match/';

function promiseSave(data, filePath) {
    return new Promise(function save(resolve, reject) {
        fs.writeFile(filePath, data, function handleResp(err) {
            if (!err) {
                resolve();
            }
            else {
                reject(Error(err));
            }
        });
    });
}

function promiseGet(url) {
    console.log('Sending GET request to: ' + url);
    return new Promise(function get(resolve, reject) {
        request.get(url, function handleResp(err, resp, data) {
            if (err) {
                reject(Error(err));
            }
            else if (resp.statusCode != 200) {
                reject(Error('Resp status code not 200: ' + resp.statusCode + '(' + url + ')'));
            }
            else {
                resolve(data);
            }
        });
    });
}
function promiseJsonGet(url) {
    return promiseGet(url).then(JSON.parse);
}

function requestGet(url) {
    
}

function repetitiveJsonGet(url) {
    console.log('Sending repetitive GET request to: ' + url);
    return new Promise(function repetitiveGet(resolve, reject) {
        request.get(url, function handleResp(err, resp, data) {
            if (err)
                reject(Error(err));
            else if (resp.statusCode == 429 || resp.statusCode == 503) {
                console.log('Repeating request to ' + url + '... (' + resp.statusCode + ')');
                setTimeout(function() { resolve(repetitiveJsonGet(url)); }, 100);
            }
            else if (resp.statusCode != 200) {
                reject(Error(resp.statusCode + ': ' + url));
            }
            else
                resolve(data);
        });
    });
}

function promiseReadFile(filePath) {
    return new Promise(function read(resolve, reject) {
        fs.readFile(filePath, function handleResp(err, fileContents) {
            if (!err) {
                resolve(fileContents);
            }
            else {
                reject(Error(err));
            }
        });
    });
}
function promiseReadJsonFile(filePath) {
    return promiseReadFile(filePath).then(JSON.parse);
}

function preprocessStaticData(staticData) {
    var subData = staticData.data;

    processed = {};

    for (var key in subData) {
        var entry = subData[key];
        processed[entry.key] = key;
    }

    return processed;
}

function convertObjectForMongo(dataObj) {
    var mongoArray = [];

    for (var key in dataObj) {
        dataObj[key]._id = key;
        mongoArray.push(dataObj[key]);
    }

    return mongoArray;
}

function getAllPlayerIds() {
    var baseLeagueUrl = API_BASE_URL + LEAGUE_DATA_ROUTE;

    var validIds = [];
    var allIds = [];

    for (var i = 0; i < 200; i += 10) {
        var ids = [
            '' + i,
            '' + (i + 1),
            '' + (i + 2),
            '' + (i + 3),
            '' + (i + 4),
            '' + (i + 5),
            '' + (i + 6),
            '' + (i + 7),
            '' + (i + 8),
            '' + (i + 9)
        ];

        allIds.push(ids);
    }

    Promise.all(
        allIds.map(function(id) {
            repetitiveJsonGet(baseLeagueUrl + ids.join() + '/entry?' + KEY_QUERY)
                .then(function extractIds(data) {
                    return Object.keys(data);
                });
        })
    )
    .then(function logIt(array) {
        console.log(array)
    });
}

getAllPlayerIds();