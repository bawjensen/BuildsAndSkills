var fs      = require('fs'),
    promise = require('./helpers/promisedFunctions');

var API_KEY = process.env.RIOT_KEY;

function convertChamps() {
    var data = JSON.parse(fs.readFileSync('dragontail/current/data/en_US/champion.json')).data;

    var translatorObj1 = {};
    var translatorObj2 = {};

    for (var champStringId in data) {
        var champId = data[champStringId].key;
        var champName = data[champStringId].name;
        translatorObj1[champName.toLowerCase()] = { id: champId, name: champName, strId: champStringId };
        translatorObj2[champId] = champName;
    }

    fs.writeFile('data-compiled/champsByName.json', JSON.stringify(translatorObj1));
    fs.writeFile('data-compiled/champsByIdNum.json', JSON.stringify(translatorObj2));
}

function convertSummonerSpells() {
    var data = JSON.parse(fs.readFileSync('dragontail/current/data/en_US/summoner.json')).data;

    var newObj = {};

    for (var summonerSpellName in data) {
        newObj[parseInt(data[summonerSpellName].key)] = data[summonerSpellName];
    }

    fs.writeFile('data-compiled/spellData.json', JSON.stringify(newObj));
}

function convertRuneData() {
    var data = JSON.parse(fs.readFileSync('dragontail/current/data/en_US/rune.json')).data;

    for (var runeId in data) {
        var runeObj = data[runeId];

        if (runeObj.rune.tier === '3') {
            runeObj.shortName = runeObj.name.replace(/(Greater|Razer) (Mark|Seal|Quintessence|Glyph) of (the )?/, '');

            runeObj.shortName = runeObj.shortName.replace(/Ability Power/, 'AP');
            runeObj.shortName = runeObj.shortName.replace(/Attack Damage/, 'AD');
            runeObj.shortName = runeObj.shortName.replace(/Penetration/, 'Pen');
            runeObj.shortName = runeObj.shortName.replace(/Regeneration/, 'Regen'); 
            runeObj.shortName = runeObj.shortName.replace(/Cooldown Reduction/, 'CDR');
            runeObj.shortName = runeObj.shortName.replace(/Critical/, 'Crit');
            runeObj.shortName = runeObj.shortName.replace(/Magic Resist/, 'MR');
            runeObj.shortName = runeObj.shortName.replace(/Mana Regen/, 'M. Regen');
            runeObj.shortName = runeObj.shortName.replace(/Health Regen/, 'H. Regen');
            runeObj.shortName = runeObj.shortName.replace(/Movement Speed/, 'Move Speed');
        }
    }

    fs.writeFile('data-compiled/runeData.json', JSON.stringify(data));
}

convertChamps();
convertSummonerSpells();
convertRuneData();