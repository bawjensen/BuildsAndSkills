var bodyParser  = require("body-parser"),
    express     = require("express"),
    fs          = require("fs"),
    logfmt      = require("logfmt"),
    MongoClient = require('mongodb').MongoClient,
    request     = require("request"),
    querystring = require("querystring");

// Global constants
var MONGO_URL = 'mongodb://bawjensen:dummypass@ds031531.mongolab.com:31531/heroku_app33050572';
var CHAMP_ROUTE = '/:champName';

var app = express();

// Server defaults to port 7500
app.set('port', (process.env.PORT || 5000));

// Static serving files from specific folders
// app.use('/favicon.ico', express.static(__dirname + '/favicon.ico'));
app.use('/css',         express.static(__dirname + '/css'));
app.use('/js',          express.static(__dirname + '/js'));
app.use('/images',      express.static(__dirname + '/images'));
app.use('/data',        express.static(__dirname + '/data'));
app.use('/bootstrap',   express.static(__dirname + '/bootstrap'));

// Other stuff to use
app.use(logfmt.requestLogger());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function loadChampIdTranslator() {
    return JSON.parse(fs.readFileSync('data/data-compiled/champIds.json'));
}
function loadChampNameTranslator() {
    return JSON.parse(fs.readFileSync('data/data-compiled/champNames.json'));
}
function loadStaticData() {
    return {
        // runes: JSON.parse(fs.readFileSync('data/dragontail/current/data/en_US/rune.json')),
        runes: JSON.parse(fs.readFileSync('data/data-compiled/runeData.json')),
        masteries: JSON.parse(fs.readFileSync('data/dragontail/current/data/en_US/mastery.json')),
        items: JSON.parse(fs.readFileSync('data/dragontail/current/data/en_US/item.json')),
        champs: JSON.parse(fs.readFileSync('data/data-compiled/champData.json')),
        summSpells: JSON.parse(fs.readFileSync('data/data-compiled/spellData.json'))
    };
}
function loadFrontPageData() {
    var data = JSON.parse(fs.readFileSync('data/dragontail/current/data/en_US/champion.json')).data;
    var dataArray = Object.keys(data).map(function(key) { return data[key]; });

    dataArray.sort(function(a, b) { return (a.name < b.name) ? -1 : 1; });

    return dataArray;
}


var mainRouter = express.Router();

mainRouter
    .all('*', function(req, res, next) {
        console.log('Loading site-wide data');
        res.locals.championNames = loadFrontPageData().map(function(entry) { return entry.id; });
        next();
    })

    .get('/', function(req, res) {
        console.log('Loading front page data and rendering');
        res.render('index.jade', { data: loadFrontPageData() });
    })

    .use(CHAMP_ROUTE, function(req, res, next) {
        var champName = req.params.champName;
        console.log('Checking redirect for ' + champName);
        if (!isNaN(champName)) {
            res.redirect(loadChampIdTranslator()[champName]);
        }
        else {
            next();
        }
    })
    .all(CHAMP_ROUTE, function(req, res, next) {
        MongoClient.connect(MONGO_URL, function callback(err, db) {
            req.dbCollection = db.collection('champData');
            next();
        });
    })
    .get(CHAMP_ROUTE, function(req, res) {
        var champName = req.params.champName;
        var champId = loadChampNameTranslator()[champName.toLowerCase()];

        var staticData = loadStaticData();

        req.dbCollection.find({ champId: champId }).sort({ date: -1 }).limit(10).toArray(function callback(err, games) {
            if (err) {
                console.log(err.stack);
                res.send('no');
            }
            else if (games === null) {
                console.log('No one played ' + champName + ' - ' + champId);
                res.send('no');
            }
            else {
                // res.send('yes');
                // console.log(games);
                // console.log(staticData)
                res.render('champion.jade', { gamesData: games, champId: champId, staticData: staticData });
            }
        });
    });


app.use('/', mainRouter);

// Start up the server
app.listen(app.get('port'), function() {
    console.log("Active!");
});
