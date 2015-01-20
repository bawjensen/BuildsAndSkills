var bodyParser  = require("body-parser"),
    express     = require("express"),
    fs          = require("fs"),
    logfmt      = require("logfmt"),
    MongoClient = require('mongodb').MongoClient,
    request     = require("request"),
    querystring = require("querystring");

// Global constants
var MONGO_URL = 'mongodb://bawjensen:dummypass@ds031531.mongolab.com:31531/heroku_app33050572';

function promiseGet(url) {
    return new Promise(function get(resolve, reject) {
        request.get(url, function handleResp(err, resp, body) {
            if (!err) {
                resolve(body);
            }
            else {
                reject(Error(err));
            }
        });
    });
}

function promiseJsonGet(url) {
    return promiseGet(url).then(JSON.parse);
}

function promiseReadFile(filePath) {
    return new Promise(function read(resolve, reject) {
        fs.readFile(filePath, function handleResp(err, fileContents) {
            if (!err) {
                resolve(fileContents);
            }
            else {
                reject(Error(err));
            }
        });
    });
}

function promiseReadJsonFile(filePath) {
    return promiseReadFile(filePath).then(JSON.parse);
}

var app = express();

// Server defaults to port 7500
app.set('port', (process.env.PORT || 5000));

// Static serving files from specific folders
app.use('/css',         express.static(__dirname + '/css'));
app.use('/js',          express.static(__dirname + '/js'));
app.use('/images',      express.static(__dirname + '/images'));
app.use('/data',        express.static(__dirname + '/data'));
app.use('/bootstrap',   express.static(__dirname + '/bootstrap'));

// Other stuff to use
app.use(logfmt.requestLogger());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// app.get('/', function(req, res) {
//     promiseReadJsonFile('data/champData.json')
//         .then(function display(champData) {
//             res.render('index.jade', { champData: champData });
//         })
//         .catch(function handleError(err) {
//             res.send(err.stack);
//         })
// });

app.route('/champ/:champName')
    .all(function(req, res, next) {
        MongoClient.connect(MONGO_URL, function callback(err, db) {
            req.dbCollection = db.collection('champData');
            next();
        });
    })
    .get(function(req, res) {
        var champName = req.params.champName;

        var staticData = {
            runes: JSON.parse(fs.readFileSync('data/dragontail/4.21.4/data/en_US/rune.json')),
            masteries: JSON.parse(fs.readFileSync('data/dragontail/4.21.4/data/en_US/mastery.json')),
            items: JSON.parse(fs.readFileSync('data/dragontail/4.21.4/data/en_US/item.json')),
            champs: JSON.parse(fs.readFileSync('data/champData.json')),
            summSpells: JSON.parse(fs.readFileSync('data/spellData.json'))
        };

        if (!isNaN(parseInt(champName))) {
            champName = staticData.champs[parseInt(champName)].name;
        }

        console.log('champName: ' + champName);

        req.dbCollection.find({ '_id': champName }).toArray(function callback(err, data) {
            if (err) {
                console.log(err.stack);
                res.send('no');
            }
            else if (data.length == 0) {
                console.log('No one played ' + champName);
                res.send('no');
            }
            else {
                // res.send('yes');
                res.render('champion_v2.jade', { champData: { array: data, champName: champName }, staticData: staticData });
            }
        });



        // promiseReadJsonFile('data/dragontail/4.21.4/data/en_US/rune.json')
        //     .then(function readNext(staticRuneData) {
        //         return promiseReadJsonFile('data/champData.json')
        //             .then(function returnBoth(champData) {
        //                 return { staticRuneData: staticRuneData, champData: champData };
        //             });
        //     })
        //     .then(function display(allData) {
        //         res.render('champion.jade', { champData: allData.champData[champName], staticRuneData: allData.staticRuneData });
        //     }).catch(function handleError(err) {
        //         res.send(err.stack);
        //     });
    });

// Start up the server
app.listen(app.get('port'), function() {
    console.log("Active!");
});
