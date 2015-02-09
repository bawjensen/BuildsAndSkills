var fs = require('fs');

function convertChamps() {
    var data = JSON.parse(fs.readFileSync('dragontail/current/data/en_US/champion.json')).data;

    var convertedObj = {};
    var translatorObj1 = {};
    var translatorObj2 = {};

    for (var champName in data) {
        var champId = parseInt(data[champName].key);
        convertedObj[champId] = data[champName];
        translatorObj1[champName.toLowerCase()] = champId;
        translatorObj2[champId] = champName;
    }

    fs.writeFile('data-compiled/champData.json', JSON.stringify(convertedObj));
    fs.writeFile('data-compiled/champNames.json', JSON.stringify(translatorObj1));
    fs.writeFile('data-compiled/champIds.json', JSON.stringify(translatorObj2));
}

function convertSummonerSpells() {
    var data = JSON.parse(fs.readFileSync('dragontail/current/data/en_US/summoner.json')).data;

    var newObj = {};

    for (var summonerSpellName in data) {
        newObj[parseInt(data[summonerSpellName].key)] = data[summonerSpellName];
    }

    fs.writeFile('data-compiled/spellData.json', JSON.stringify(newObj));
}

convertChamps();
convertSummonerSpells();