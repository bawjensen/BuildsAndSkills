var fs = require('fs');

function convertChamps() {
    var data = JSON.parse(fs.readFileSync('dragontail/4.21.4/data/en_US/champion.json')).data;

    var newObj = {};

    for (var champName in data) {
        newObj[parseInt(data[champName].key)] = data[champName];
    }

    fs.writeFile('champData.json', JSON.stringify(newObj));
}

function convertSummonerSpells() {
    var data = JSON.parse(fs.readFileSync('dragontail/4.21.4/data/en_US/summoner.json')).data;

    var newObj = {};

    for (var summonerSpellName in data) {
        newObj[parseInt(data[summonerSpellName].key)] = data[summonerSpellName];
    }

    fs.writeFile('spellData.json', JSON.stringify(newObj));
}

convertChamps();
convertSummonerSpells();