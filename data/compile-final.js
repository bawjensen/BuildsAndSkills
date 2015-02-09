var request     = require('request'),
    promise     = require('./helpers/promisedFunctions'),
    querystring = require('querystring');

var BASE_URL    = 'https://na.api.pvp.net';
var API_KEY     = '81216707-de8d-4484-9d08-619de3821271';
var KEY_QUERY = querystring.stringify({ api_key: API_KEY });

var MATCH_ROUTE = '/api/lol/na/v2.2/match/'

function compileData() {
    var limit = Infinity;
    if (process.argv[2]) {
        limit = parseInt(process.argv[2]);
        console.log('Limiting to ' + limit + ' matches');
    }

    promise.readJson('data-compiled/matches.json')
        .then(function fetchMatches(matches) {
            var includeTimelineQuery = querystring.stringify({ includeTimeline: true })
            return Promise.all(
                matches.slice(0, limit).map(function(matchId) {
                    return promise.persistentGet(BASE_URL + MATCH_ROUTE + matchId + '?' + includeTimelineQuery + '&' + KEY_QUERY);
                })
            );
        })
        .then(function extractData(matchesArray) {
            champsObj = {};

            matchesArray.forEach(function handleMatch(matchEntry) {
                var matchDate = new Date(matchEntry.matchCreation);
                var dateString = matchDate.toDateString();

                matchEntry.participants.forEach(function handleParticipant(participant, i) {
                    var champId = participant.championId;

                    if (!(champId in champsObj))
                        champsObj[champId] = [];

                    // matchDataObjs.push({
                    champsObj[champId].push ({
                        champId:        participant.championId,
                        summonerName:   matchEntry.participantIdentities[i].player.summonerName,
                        winner:         participant.stats.winner,
                        runes:          participant.runes,
                        masteries:      participant.masteries,
                        lane:           participant.timeline.lane,
                        kills:          participant.stats.kills,
                        deaths:         participant.stats.deaths,
                        assists:        participant.stats.assists,
                        finalBuild:     [
                                            participant.stats.item0,
                                            participant.stats.item1,
                                            participant.stats.item2,
                                            participant.stats.item3,
                                            participant.stats.item4,
                                            participant.stats.item5,
                                            participant.stats.item6
                                        ],
                        summonerSpells: [
                                            participant.spell1Id,
                                            participant.spell2Id
                                        ],
                        date:           dateString
                    });
                });
            });

            return champsObj;
        })
        .then(function saveData(champData) {
            promise.save('data-compiled/data.json', JSON.stringify(champData, null, 2));
        })
        .catch(function(err) {
            console.log(err.stack);
        });
}

compileData();