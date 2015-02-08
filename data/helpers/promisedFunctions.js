var exec    = require('child_process').exec,
    fs      = require('fs'),
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

function promisePipeFile(url, filePath) {
    return new Promise(function save(resolve, reject) {
        var outStream = fs.createWriteStream(filePath);
        var pipe = request.get(url).pipe(outStream);
        outStream.on('finish', resolve);
    });
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


function persistentCallback(url, resolve, reject, err, resp, body) {
    if (err)
        reject(Error(err));
    else if (resp.statusCode == 429 || resp.statusCode == 503)
        setTimeout(function() {
            request.get(url, persistentCallback.bind(null, url, resolve, reject));
        }, 100);
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

function promiseExec(command, options) {
    return new Promise(function execute(resolve, reject) {
        exec(command, options, function callback(err, stdout, stderr) {
            if (err)
                reject(Error(err));
            else
                resolve();
        });
    });
}

module.exports = {
    save:               promiseSave,
    get:                promiseGet,
    getJson:            promiseJsonGet,
    read:               promiseReadFile,
    readJson:           promiseReadJsonFile,
    persistentGet:      persistentPromiseGet,
    getPipe:            promisePipeFile,
    exec:               promiseExec
}