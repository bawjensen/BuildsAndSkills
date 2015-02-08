var request     = require('request'),
    promise     = require('./helpers/promisedFunctions'),
    querystring = require('querystring');

var BASE_URL    = 'https://na.api.pvp.net';
var API_KEY     = '81216707-de8d-4484-9d08-619de3821271';
var KEY_QUERY = querystring.stringify({ api_key: API_KEY });

var MATCH_HISTORY_ROUTE = '/api/lol/na/v2.2/matchhistory/'

function compileMatches() {
    promise.readJson('data-compiled/players.json')
        .then(function fetchMatches(players) {
            var baseRoute = BASE_URL + MATCH_HISTORY_ROUTE;
            return Promise.all(
                players.map(function(id) {
                    return promise.persistentGet(baseRoute + id + '?' + KEY_QUERY);
                })
            );
        })
        .then(function extractMatchesData(matchHistoriesArray) {
            var desiredMap = 11; // New summoner's rift id
            var desiredMode = 'CLASSIC';
            var desiredType = 'MATCHED_GAME';

            var extractedMatches = {};

            for (var i in matchHistoriesArray) {
                var matches = matchHistoriesArray[i].matches;

                for (var j in matches) {
                    var match = matches[j];

                    if (match.mapId == desiredMap && match.matchMode == desiredMode && match.matchType == desiredType) {
                        extractedMatches[match.matchId] = true;
                    }
                }
            }

            return Object.keys(extractedMatches);
        })
        .then(function saveMatches(matches) {
            console.log('Got ' + matches.length + ' matches');
            promise.save('data-compiled/matches.json', JSON.stringify(matches));
        })
        .catch(function(err) {
            console.log(err.stack);
        });
}

compileMatches();