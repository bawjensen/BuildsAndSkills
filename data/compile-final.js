var fs          = require('fs'),
    request     = require('request'),
    promise     = require('./helpers/promisedFunctions'),
    querystring = require('querystring');

var BASE_URL    = 'https://na.api.pvp.net';
var API_KEY     = '81216707-de8d-4484-9d08-619de3821271';
var KEY_QUERY = querystring.stringify({ api_key: API_KEY });

var MATCH_ROUTE = '/api/lol/na/v2.2/match/';
var RATE_LIMIT = 10; // Per 10 seconds
var RATE_LIMIT_PERIOD = 10000; // 10 seconds

function convertToObject(runesOrMasteries) {
    var newObj = {};

    for (var i in runesOrMasteries) {
        var runeOrMastery = runesOrMasteries[i];

        var key;
        if (runeOrMastery.runeId) {
            key = 'runeId';
        }
        else {
            key = 'masteryId';
        }
        newObj[runeOrMastery[key]] = runeOrMastery.rank;
    }

    return newObj;
}

function extractMasterySummary(masteries) {
    var masteryTreeMapper = JSON.parse(fs.readFileSync('data-compiled/masteryTreeData.json'));

    var trees = {
        'Offense': 0,
        'Defense': 0,
        'Utility': 0
    };

    masteries.forEach(function(mastery) {
        trees[masteryTreeMapper[mastery.masteryId]] += mastery.rank;
    });

    return trees;
}

function groupPurchases(buys) {
    if (!buys)
        return [];
    
    var grouped = [];
    var i = 0;

    while (i < buys.length) {
        var subGroup = {};
        var starterTime = buys[i].time;

        while ((i < buys.length) && (buys[i].time - starterTime) < 30000) { // 30 time window of buying
            var itemId = buys[i].id;

            if (!(itemId in subGroup))
                subGroup[itemId] = 0;

            subGroup[itemId]++;
            i++;
        }

        grouped.push(subGroup);
        i++;
    }

    // console.log(buys);
    // console.log(grouped);
    // console.log();

    return grouped;
}

function parseSkillsAndBuysFromTimeline(matchEntry) {
    matchEntry.timeline.frames.forEach(function handleFrame(frame, i) {
        if (!frame.events) return;

        frame.events.forEach(function handleEvent(evt) {
            if (evt.eventType === 'SKILL_LEVEL_UP') {
                var id = evt.participantId - 1; // Adjust the index by 1
                var participant = matchEntry.participants[id];

                if (!(participant.skills))
                    participant.skills = [];

                participant.skills.push(evt.skillSlot);
            }
            else if (evt.eventType === 'ITEM_PURCHASED') {
                var id = evt.participantId - 1; // Adjust the index by 1
                var participant = matchEntry.participants[id];

                if (!(participant.buys))
                    participant.buys = [];


                participant.buys.push({ time: evt.timestamp, id: evt.itemId });
            }
        });
    });
}

function compileData() {
    var limit = Infinity;
    if (process.argv[2]) {
        limit = parseInt(process.argv[2]);
        console.log('Limiting to ' + limit + ' matches');
    }

    var champDataArray = [];

    promise.readJson('data-compiled/matches.json')
        .then(function fetchMatches(matches) {
            var includeTimelineQuery = querystring.stringify({ includeTimeline: true });

            var matches = matches.slice(0, limit);
            var groupedMatches = [];
            var numMatches = matches.length;

            var i = 0;
            while (i < matches.length) {
                groupedMatches.push(matches.slice(i, i+RATE_LIMIT));
                i += RATE_LIMIT;
            }

            var rateLimitRatio = 0.75;

            return groupedMatches.reduce(function chainPromiseAlls(chainSoFar, matchesGroup, i) {
                return chainSoFar.then(function() {
                    return Promise.all(
                            matchesGroup.map(function mapMatch(matchId) {
                                return promise.persistentGet(BASE_URL + MATCH_ROUTE + matchId + '?' + includeTimelineQuery + '&' + KEY_QUERY);
                            })
                        )
                        .then(function assignData(matchesArray) {
                            matchesArray.forEach(function handleMatch(matchEntry) {
                                // var matchDate = new Date(matchEntry.matchCreation);
                                // var dateString = (matchDate.getMonth() + 1) + '/' + matchDate.getUTCDate() + '/' + matchDate.getUTCFullYear();

                                parseSkillsAndBuysFromTimeline(matchEntry);

                                matchEntry.participants.forEach(function handleParticipant(participant, i) {
                                    var champId = participant.championId;

                                    if (participant.participantId != i+1) {
                                        throw new Error('Issue: The participant index (' + i + ') doesn\'t match the id (' + participant.participantId + ')');
                                    }

                                    // if (!(champId in champDataArray))
                                        // champDataArray[champId] = [];

                                    var buyOrder = groupPurchases(participant.buys);
                                    var runes = convertToObject(participant.runes);
                                    var masteries = convertToObject(participant.masteries);

                                    var masterySummary = extractMasterySummary(participant.masteries);

                                    // matchDataObjs.push({
                                    champDataArray.push ({
                                        champId:        participant.championId,
                                        summonerName:   matchEntry.participantIdentities[i].player.summonerName,
                                        winner:         participant.stats.winner,
                                        runes:          runes,
                                        masteries:      masteries,
                                        masterySummary: masterySummary,
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
                                        date:           matchEntry.matchCreation,
                                        skillOrder:     participant.skills,
                                        buyOrder:       buyOrder
                                    });
                                });
                            });
                        })
                        .then(function() {
                            var numFinished = (i + 1) * 10;
                            console.log('Finished ' + numFinished + ', napping before the next set');
                            
                            var promiseBuffer = (numFinished < numMatches) ? promise.wait(RATE_LIMIT_PERIOD * rateLimitRatio) : Promise.resolve();
                            return promiseBuffer;
                        });
                    });
            }, Promise.resolve());
        })
        .then(function saveData() {
            promise.save('data-compiled/data.json', JSON.stringify(champDataArray));
        })
        .catch(function(err) {
            console.log(err.stack);
            exit(1);
        });
}

compileData();