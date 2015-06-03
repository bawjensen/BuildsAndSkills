var exec        = require('child_process').exec,
    fs          = require('fs'),
    path        = require('path'),
    promise     = require('./helpers/promisedFunctions');

var SAVE_DIR = 'dragontail';
var TEMP_DIR = SAVE_DIR + '_temp';

var SAVE_NAME = 'dragontail.tgz';

var SAVE_LOCATION = SAVE_DIR + '/' + SAVE_NAME;
var TEMP_LOCATION = TEMP_DIR + '/' + SAVE_NAME;


function updateStaticData() {
    // Change the current working directory, making it the location of the script
    // console.log(process.cwd());
    process.chdir(path.dirname(process.argv[1]));
    // console.log(process.cwd());

    var versionDataDir;

    promise.exec('pwd');

    console.log('Creating temp folder');
    promise.exec('mkdir ' + TEMP_DIR)
        .then(function getVersions() {
            console.log('Getting versions');
            return promise.getJson('https://ddragon.leagueoflegends.com/api/versions.json');
        })
        .then(function getLatestData(versions) {
            console.log('Getting data');
            versionDataDir = SAVE_DIR + '/' + versions[0];
            return promise.getPipe('http://ddragon.leagueoflegends.com/cdn/dragontail-' + versions[0] + '.tgz', TEMP_LOCATION);
        })
        .then(function removeOldData() {
            console.log('Cleaning old data');
            return promise.exec('rm -r ' + SAVE_DIR + '/*')
        })
        .catch(function ignoreIt(err) {
            if (err.message.indexOf('rm -r ') > -1) {
                console.log('Note: Didn\'t remove old data');
                return;
            }
            else {
                throw err;
            }
        })
        .then(function moveDataOver() {
            console.log('Renaming new data dir');
            return promise.exec('mv ' + TEMP_LOCATION + ' ' + SAVE_LOCATION);
        })
        .then(function moveDataOver() {
            console.log('Deleting temp data dir');
            return promise.exec('rmdir ' + TEMP_DIR);
        })
        .then(function extractData() {
            console.log('Unzipping the data');
            return promise.exec('tar -zxf ' + SAVE_NAME, { cwd: SAVE_DIR });
        })
        .then(function removeZip() {
            console.log('Deleting the archive');
            return promise.exec('rm ' + SAVE_LOCATION);
        })
        .then(function renameSubFolder() {
            console.log('Renaming the version directory');
            return promise.exec('mv ' + versionDataDir + ' ' + SAVE_DIR + '/current');
        })
        .catch(function handleIt(err) {
            console.log(err.stack);
            throw err;
        });
}

updateStaticData();