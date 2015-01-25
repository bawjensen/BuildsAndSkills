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


var bodyParser  = require("body-parser"),
    express     = require("express"),
    fs          = require("fs"),
    logfmt      = require("logfmt"),
    MongoClient = require('mongodb').MongoClient,
    request     = require("request"),
    querystring = require("querystring");

var KEY = '81216707-de8d-4484-9d08-619de3821271';
var MONGO_URL = 'mongodb://bawjensen:dummypass@ds031531.mongolab.com:31531/heroku_app33050572';

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
        request.get(url, function handleResp(err, resp, body) {
            if (err) {
                reject(Error(err));
            }
            else if (resp.statusCode != 200) {
                reject(Error('Resp status code not 200: ' + resp.statusCode + '(' + url + ')'));
            }
            else {
                resolve(body);
            }
        });
    });
}
function promiseJsonGet(url) {
    return promiseGet(url).then(JSON.parse);
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

function getDataFor(leagues, divisions) {
    var baseUrl = 'https://na.api.pvp.net';

    var challengerQueryRoute    = '/api/lol/na/v2.5/league/challenger?';
    var matchHistoryRoute       = '/api/lol/na/v2.2/matchhistory/';
    var leagueDataRoute         = '/api/lol/na/v2.5/league/by-summoner/';
    var masteryRoute            = '/api/lol/static-data/na/v1.2/mastery/';

    var challengerQuery  = {
        type: 'RANKED_SOLO_5x5',
        api_key: KEY
    };

    var seedPlayers = [
        '51405', // C9 Sneaky
        '20132258' // Doublelift
    ];

    var queryUrl = baseUrl + leagueDataRoute + seedPlayers.join() + '?' + querystring.stringify({ api_key: KEY });

    promiseJsonGet(queryUrl)
        .then(function grabAllFellowMembers(dataObj) {
            var processedDataObj = {};

            for (var player in seedPlayers) {
                player = seedPlayers[player];
                var playerLeague = dataObj[player][0];

                if (leagues.indexOf(playerLeague.tier) == -1) continue;

                var leagueName = playerLeague.name.toLowerCase().replace(/'/, '').replace(/ /g, '');

                processedDataObj[leagueName] = {};

                for (var fellowPlayer in playerLeague.entries) {
                    fellowPlayer = playerLeague.entries[fellowPlayer];
                    if (divisions.indexOf(fellowPlayer.division) == -1) continue;

                    processedDataObj[leagueName][fellowPlayer.playerOrTeamId] = {
                        id: fellowPlayer.playerOrTeamId,
                        name: fellowPlayer.playerOrTeamName
                    }
                }
            }

            console.log(JSON.stringify(processedDataObj, null, 2));
        })
        .catch(function(err) {
            console.log(err.stack);
        });
}

getDataFor(['PLATINUM'], ['I']);