var argv        = require('optimist').argv,
    bodyParser  = require('body-parser'),
    // cookieParser = require('cookie-parser'),
    express     = require('express'),
    fs          = require('fs'),
    logfmt      = require('logfmt'),
    MongoClient = require('mongodb').MongoClient,
    querystring = require('querystring'),
    request     = require('request'),
    session     = require('express-session');

// Global constants
var MONGO_URL = process.env.MONGO_URL_PREFIX + argv.be_ip + process.env.MONGO_URL_DB;

var app = express();

// Server defaults to port 5000
app.set('port', (process.env.PORT || argv.port || 5000));

// Session stuff
app.use(session({
    secret: 'noonewilleverknow',
    resave: false,
    saveUninitialized: false
}));
// app.use(cookieParser());

// Static serving files from specific folders
app.use('/css',         express.static(__dirname + '/css'));
app.use('/js',          express.static(__dirname + '/js'));
app.use('/images',      express.static(__dirname + '/images'));
app.use('/data',        express.static(__dirname + '/data'));
app.use('/bootstrap',   express.static(__dirname + '/bootstrap'));
app.use('/riot.txt',    express.static(__dirname + '/riot.txt')); // Needed for riot's 3rd party app approval process

// Other stuff to use
app.use(logfmt.requestLogger());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ================================= Helper functions =================================

function loadChampIdTranslator() {
    return JSON.parse(fs.readFileSync('data/data-compiled/champsByIdNum.json'));
}
function loadChampNameTranslator() {
    return JSON.parse(fs.readFileSync('data/data-compiled/champsByName.json'));
}
function loadStaticData(champStringId) {
    return {
        // runes: JSON.parse(fs.readFileSync('data/dragontail/current/data/en_US/rune.json')),
        runes: JSON.parse(fs.readFileSync('data/data-compiled/runeData.json')),
        masteries: JSON.parse(fs.readFileSync('data/dragontail/current/data/en_US/mastery.json')),
        items: JSON.parse(fs.readFileSync('data/dragontail/current/data/en_US/item.json')),
        // champs: JSON.parse(fs.readFileSync('data/data-compiled/champData.json')),
        champs: JSON.parse(fs.readFileSync('data/dragontail/current/data/en_US/champion.json')),
        summSpells: JSON.parse(fs.readFileSync('data/data-compiled/spellData.json')),
        champInfo: JSON.parse(fs.readFileSync('data/dragontail/current/data/en_US/champion/' + champStringId + '.json'))
    };
}

function loadSiteWideData() {
    var champNamesObj = JSON.parse(fs.readFileSync('data/data-compiled/champsByName.json'));
    var champNamesArray = Object.keys(champNamesObj).map(function(key) { return champNamesObj[key]; });

    champNamesArray
        .sort(function(a, b) {
            return (a.name < b.name) ? -1 : 1;
        })
        .map(function(entry) {
            return { id: entry.id, name: entry.name };
        });

    var version = fs.readFileSync('data/version.txt', 'utf8');

    return { champs: champNamesArray, version: version };
}

function loadFrontPageData() {
    var data = JSON.parse(fs.readFileSync('data/dragontail/current/data/en_US/champion.json')).data;
    var dataArray = Object.keys(data).map(function(key) { return data[key]; });

    dataArray.sort(function(a, b) { return (a.name < b.name) ? -1 : 1; });

    return dataArray;
}

// ================================= Routing functions ================================

var mainRouter = express.Router();


// Site-wide middleware
mainRouter
    .use('*', function(req, res, next) {
        var siteWideData = loadSiteWideData();
        res.locals.simpleChamps = siteWideData.champs;
        res.locals.version = siteWideData.version;
        res.locals.titleCase = function(str) { return str[0].toUpperCase() + str.slice(1, Infinity).toLowerCase(); };
        next();
    });


// Main page middleware and routes
mainRouter.route('/')
    .get(function(req, res) {
        res.render('index.jade', { data: loadFrontPageData() });
    });


// FAQ middleware and routes
mainRouter.route('/faq')
    .get(function(req, res) {
        res.render('faq.jade');
    });

mainRouter.route('/info-state')
    .post(function(req, res) {
        req.session.state = req.body.newState;
        res.send(true);
    });

// ================================= Champ Page functions =============================

function loadItemBlacklist(req, res, next) {
    res.locals.blacklisted = function(itemId) {
        var itemBlacklist = {
            '1004': true, // Faerie Charm
            '1006': true, // Rejuv Bead
            '1027': true, // Sapphire Crystal
            '1028': true, // Health Crystal
            '1029': true, // Cloth Armor
            '1033': true, // Null-Magic Mantle
            '1036': true, // Long Sword
            '1042': true, // Dagger
            '1051': true, // Brawler's Gloves
            '1052': true, // Amp. Tome
            '2003': true, // Health Potion
            '2004': true, // Mana Potion
            '2010': true, // Total Biscuit
            '2043': true, // Vision Ward
            '2044': true, // Stealth Ward
            '2137': true, // Elixir of Ruin
            '2138': true, // Elixir of Iron
            '2139': true, // Elixir of Sorcery
            '2140': true, // Elixir of Wrath
        };

        return itemBlacklist[itemId];
    };

    next();
}

function reroute(req, res, next) {
    var champRoute = req.params.champRoute;
    var role = req.params.role;

    var redirecting = false;

    var newRoute = req.url; // Default to old route

    var isNum = !isNaN(champRoute);
    var isUppercase = /[A-Z]/.test(champRoute);

    if (isNum || isUppercase) {
        var idTranslator = loadChampIdTranslator();

        var routeBase = isNum ? idTranslator[champRoute] : champRoute.toLowerCase();

        redirecting = true;

        newRoute = '/' + routeBase + '/' + (role ? role + '/' : '');
    }
    if (newRoute.indexOf('/', newRoute.length - 1) === -1) { // testing if it ends with '/'
        newRoute += '/';
        redirecting = true;
    }

    if (redirecting) {
        console.log('Was redirecting, redirecting:', newRoute);
        res.redirect(newRoute);
    }
    else {
        next();
    }
}

function loadMongoDb(req, res, next) {
    console.log('Connecting to', MONGO_URL, 'for db');
    MongoClient.connect(MONGO_URL, function callback(err, db) {
        if (err) {
            console.log(err);
            res.status(503).render('503.jade');
        }
        else {
            req.db = db;
            next();
        }
    });
}

function champPageHandler(req, res) {
    var champRoute = req.params.champRoute;
    var role = req.params.role;
    res.locals.activeRole = role;

    var champData = loadChampNameTranslator()[champRoute];

    if (!champData) {
        res.status(404).render('404.jade');
        return;
    }

    var champId = parseInt(champData.id);
    var champStringId = champData.strId;

    var staticData = loadStaticData(champStringId);

    var criteria = {
        champId: champId
    };

    req.db.collection('champData')
        .find(criteria, { role: 1, _id: 0 })
        .toArray(function callback(err, roles) {
            var uniqueRoles = {};
            roles.forEach(function(entry) {
                uniqueRoles[entry.role] = true;
            });

            res.locals.uniqueRoles = Object.keys(uniqueRoles);

            if (role) {
                criteria.role = {
                    $regex: role,
                    $options: 'i'
                };
            }

            req.db.collection('champData').count(criteria, function(err, count) {
                res.locals.numGames = count;

                req.db.collection('champData')
                    .find(criteria)
                    .sort({ date: -1 })
                    .limit(10)
                    .toArray(function callback(err, games) {
                        req.db.close();

                        res.locals.champName = champData.name;
                        res.locals.champStringId = champStringId;

                        if (!req.session.state)
                            req.session.state = 'in-game';
                        
                        res.locals.displayMode = req.session.state;

                        if (err) {
                            console.log(err.stack);
                            res.status(503).render('503.jade');
                        }
                        else if (!games.length) {
                            res.render('champion.jade', { staticData: staticData });
                        }
                        else {
                            res.render('champion.jade', { gamesData: games, staticData: staticData });
                        }
                    });
            });
        });
}

// Champ pages middleware and routes
mainRouter.route('/:champRoute/:role?')
    // Rerouting middleware
    .all(reroute)
    .all(loadMongoDb)
    // Jade-specific middleware
    // .all(loadItemBlacklist)
    .get(champPageHandler);


// Register the router
app.use('/', mainRouter);

// Start up the server
app.listen(app.get('port'), function() {
    console.log('Active on', app.get('port'));
});
