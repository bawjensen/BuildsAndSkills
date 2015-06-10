var fs      = require('fs'),
    path    = require('path'),
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

function convertRunes() {
    var data = JSON.parse(fs.readFileSync('dragontail/current/data/en_US/rune.json')).data;

    var newObj = {};

    for (var runeId in data) {
        newObj[runeId] = { type: data[runeId].rune.type };
    }

    fs.writeFile('data-compiled/runes.json', JSON.stringify(newObj));
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
            runeObj.shortName = runeObj.shortName.replace(/Mana Regen/, 'Mana Regen');
            runeObj.shortName = runeObj.shortName.replace(/Health Regen/, 'Health Regen');
            runeObj.shortName = runeObj.shortName.replace(/Movement Speed/, 'Move Speed');
        }
    }

    fs.writeFile('data-compiled/runeData.json', JSON.stringify(data));
}

function convertMasteryData() {
    var masteryTree = JSON.parse(fs.readFileSync('dragontail/current/data/en_US/mastery.json')).tree;

    var map = {};

    Object.keys(masteryTree).forEach(function handleBranch(branchName) { // Offense, Defense, Utility
        var branch = masteryTree[branchName];
        branch.forEach(function handleTier(tier) { // 0-5
            tier.forEach(function handleSlot(slot) {
                if (slot) // Checks for 'null' paddings
                    map[slot.masteryId] = branchName;
            });
        });
    });

    fs.writeFile('data-compiled/masteryTreeData.json', JSON.stringify(map));
}

// Change the current working directory, making it the location of the script
process.chdir(path.dirname(process.argv[1]));

// Call everything
convertChamps();
convertSummonerSpells();
convertRunes();
convertRuneData();
convertMasteryData();
