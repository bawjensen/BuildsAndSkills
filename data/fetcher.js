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
    request     = require("request"),
    querystring = require("querystring");

var key = '19deda21-b9ca-40d3-af2c-5037a30b37b9';

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
        api_key: key
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
                api_key: key
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

            histories.forEach(function handleEntry(historyEntry) {
                historyEntry.matches.forEach(function handleEntry(matchEntry) {
                    var champId = matchEntry.participants[0].championId;
                    var masteries = matchEntry.participants[0].masteries;
                    var summonerName = matchEntry.participantIdentities[0].player.summonerName;
                    var runes = matchEntry.participants[0].runes;

                    if (!(champId in champDataObj)) {
                        champDataObj[champId] = {};
                        champDataObj[champId].matches = [];

                        var staticChamp = staticData[champId];

                        champDataObj[champId].name = staticChamp.name;
                        champDataObj[champId].imgLink = 'data/dragontail/4.21.4/img/champion/' + staticChamp.image.full;
                    }

                    champDataObj[champId].matches.push({ runes: runes, masteries: masteries, summonerName: summonerName });
                });
            });

            console.log(Object.keys(champDataObj)); // List all the champs that were played

            return champDataObj;
        })
        .then(function saveMasteriesAndRunes(data) {
            promiseSave(JSON.stringify(data, null, 2), 'champData.json');
        })
        .catch(function handlePromiseError(err) {
            console.log(err.stack);
            process.exit(1);
        });
}

getChallengerData();