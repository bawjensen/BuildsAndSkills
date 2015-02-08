var fs      = require('fs'),
    request = require('request');

function promiseSave(filePath, data) {
    return new Promise(function save(resolve, reject) {
        fs.writeFile(filePath, data, function handleResp(err) {
            if (!err)
                resolve();
            else
                reject(Error(err));
        });
    });
}


function persistentCallback(url, resolve, reject, err, resp, body) {
    if (err)
        reject(Error(err));
    else if (resp.statusCode == 429 || resp.statusCode == 503)
        request.get(url, persistentCallback.bind(null, url, resolve, reject));
    else if (resp.statusCode != 200)
        reject(Error('Resp status code not 200: ' + resp.statusCode + '(' + url + ')'));
    else
        resolve(body);
}
function persistentPromiseGet(url) {
    return new Promise(function get(resolve, reject) {
        request.get(url, persistentCallback.bind(null, url, resolve, reject));
    })
    .then(JSON.parse);
}

function promiseGet(url) {
    return new Promise(function get(resolve, reject) {
        request.get(url, function handleResp(err, resp, body) {
            if (err)
                reject(Error(err));
            else if (resp.statusCode != 200)
                reject(Error('Resp status code not 200: ' + resp.statusCode + '(' + url + ')'));
            else
                resolve(body);
        });
    });
}

function promiseJsonGet(url) {
    return promiseGet(url).then(JSON.parse);
}

function promiseReadFile(filePath) {
    return new Promise(function read(resolve, reject) {
        fs.readFile(filePath, function handleResp(err, fileContents) {
            if (!err)
                resolve(fileContents);
            else
                reject(Error(err));
        });
    });
}
function promiseReadJsonFile(filePath) {
    return promiseReadFile(filePath).then(JSON.parse);
}

module.exports = {
    save:               promiseSave,
    get:                promiseGet,
    getJson:            promiseJsonGet,
    read:               promiseReadFile,
    readJson:           promiseReadJsonFile,
    persistentGet:      persistentPromiseGet,
}