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

var KEY = '19deda21-b9ca-40d3-af2c-5037a30b37b9';
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
    return new Promise(function get(resolve, reject) {
        request.get(url, function handleResp(err, resp, body) {
            if (err) {
                reject(Error(err));
            }
            else if (resp.statusCode != 200) {
                reject(Error("Resp status code not 200: " + resp.statusCode));
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
        processed[entry.key] = entry;
    }

    return processed;
}

function getChallengerData() {

    var baseUrl = 'https://na.api.pvp.net';

    var challengerQueryRoute    = '/api/lol/na/v2.5/league/challenger?';
    var matchHistoryRoute       = '/api/lol/na/v2.2/matchhistory/';
    var masteryRoute            = '/api/lol/static-data/na/v1.2/mastery/';

    var challengerQuery  = {
        type: 'RANKED_SOLO_5x5',
        api_key: KEY
    };

    var queryUrl = baseUrl + challengerQueryRoute + querystring.stringify(challengerQuery);

    promiseJsonGet(queryUrl)
        .then(function consolidateChallengerIds(json) {
            challengerObjects = json.entries;

            var challengerIds = [];

            for (var key in challengerObjects) {
                var id = challengerObjects[key].playerOrTeamId;

                challengerIds.push(id);
            }

            return challengerIds.slice(0, 2);
        })
        .then(function getMatches(challengerIds) {

            var matchHistoryQuery = {
                api_key: KEY
            };

            console.log(challengerIds.length);

            return Promise.all(
                    challengerIds.map(function mapIdToPromiseGet(entry, index) {
                        return promiseJsonGet(baseUrl + matchHistoryRoute + entry + '?' + querystring.stringify(matchHistoryQuery));
                    })
                );
        })
        .then(function loadStaticData(histories) {
            return promiseReadJsonFile('dragontail/4.21.4/data/en_US/champion.json')
                .then(function returnBoth(staticData) {
                    return { staticData: staticData, histories: histories };
                });
        })
        .then(function extractRunesAndMasteries(dataObj) {
            staticData = dataObj.staticData;
            histories = dataObj.histories;

            staticData = preprocessStaticData(staticData);

            champDataObj = {};
            matchDataObjs = [];

            histories.forEach(function handleEntry(historyEntry) {
                historyEntry.matches.forEach(function handleEntry(matchEntry) {
                    matchDataObjs.push({
                        champId: matchEntry.participants[0].championId,
                        masteries: matchEntry.participants[0].masteries,
                        runes: matchEntry.participants[0].runes,
                        summonerName: matchEntry.participantIdentities[0].player.summonerName
                    });
                });
            });

            return matchDataObjs;
        })
        .then(function saveMasteriesAndRunes(data) {
            MongoClient.connect(MONGO_URL, function callback(err, db) {
                db.collection('champData').insert(data, function callback(err) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        console.log('write success');
                    }
                });
            });
        })
        .catch(function handlePromiseError(err) {
            console.log(err.stack);
            process.exit(1);
        });
}

getChallengerData();