var bodyParser  = require("body-parser"),
    express     = require("express"),
    fs          = require("fs"),
    logfmt      = require("logfmt"),
    MongoClient = require('mongodb').MongoClient,
    request     = require("request"),
    querystring = require("querystring");

// Global constants
var MONGO_URL = 'mongodb://bawjensen:dummypass@ds031531.mongolab.com:31531/heroku_app33050572';
var CHAMP_ROUTE = '/:champRoute';

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
function loadStaticData(champId) {
    return {
        // runes: JSON.parse(fs.readFileSync('data/dragontail/current/data/en_US/rune.json')),
        runes: JSON.parse(fs.readFileSync('data/data-compiled/runeData.json')),
        masteries: JSON.parse(fs.readFileSync('data/dragontail/current/data/en_US/mastery.json')),
        items: JSON.parse(fs.readFileSync('data/dragontail/current/data/en_US/item.json')),
        champs: JSON.parse(fs.readFileSync('data/data-compiled/champData.json')),
        summSpells: JSON.parse(fs.readFileSync('data/data-compiled/spellData.json')),
        champInfo: JSON.parse(fs.readFileSync('data/dragontail/current/data/en_US/champion/' + champId + '.json'))
    };
}
function loadSiteWideData() {
    var data = JSON.parse(fs.readFileSync('data/dragontail/current/data/en_US/champion.json')).data;
    var dataArray = Object.keys(data).map(function(key) { return data[key]; });

    dataArray.sort(function(a, b) { return (a.name < b.name) ? -1 : 1; });

    return dataArray;
}


var mainRouter = express.Router();

mainRouter
    .all('*', function(req, res, next) {
        console.log('Loading site-wide data');
        res.locals.simpleChamps = loadSiteWideData().map(function(entry) { return { id: entry.id, name: entry.name }; });
        next();
    })

mainRouter
    .get('/', function(req, res) {
        console.log('Loading front page data and rendering');
        res.render('index.jade', { data: loadSiteWideData() });
    })

mainRouter
    .use(CHAMP_ROUTE, function(req, res, next) {
        var champRoute = req.params.champRoute;
        if (!isNaN(champRoute)) {
            res.redirect(loadChampIdTranslator()[champRoute]);
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
        var champRoute = req.params.champRoute;
        var champData = loadChampNameTranslator()[champRoute.toLowerCase()];

        if (!champData) {
            res.status(404);
            res.render('404.jade');
        }

        var champId = champData.id;
        var champName = champData.name;

        var staticData = loadStaticData(champName);

        req.dbCollection.find({ champId: champId }).sort({ date: -1 }).limit(10).toArray(function callback(err, games) {
            if (err) {
                console.log(err.stack);
                res.send('no');
            }
            else if (!games.length) {
                console.log('No one played ' + champRoute + ' - ' + champId);
                res.send('no');
            }
            else {
                console.log(games.length);
                // res.send('yes');
                // console.log(games);
                // console.log(staticData)
                res.render('champion.jade', { gamesData: games, champId: champId, champName: champName, staticData: staticData });
            }
        });
    });


app.use('/', mainRouter);

// Start up the server
app.listen(app.get('port'), function() {
    console.log("Active!");
});
