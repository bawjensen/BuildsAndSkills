var bodyParser  = require("body-parser"),
    express     = require("express"),
    logfmt      = require("logfmt"),
    request     = require("request")
    querystring = require("querystring");

var key = '19deda21-b9ca-40d3-af2c-5037a30b37b9';

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

var app = express();

// Server defaults to port 7500
app.set('port', (process.env.PORT || 5000));

// Static serving files from specific folders
app.use('/css',         express.static(__dirname + '/css'));
app.use('/js',          express.static(__dirname + '/js'));
app.use('/images',      express.static(__dirname + '/images'));

// Other stuff to use
app.use(logfmt.requestLogger());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', function(req, res) {
    var url = 'https://na.api.pvp.net/api/lol/na/v2.5/league/challenger?';
    var query  = {
        type: 'RANKED_SOLO_5x5',
        api_key: key
    }

    var queryUrl = url + querystring.stringify(query);

    promiseJsonGet(queryUrl)
        .then(function consolidateChallengerIds(json) {
            challengerObjects = json.entries;

            var challengerIds = [];

            for (var key in challengerObjects) {
                var id = challengerObjects[key].playerOrTeamId;

                challengerIds.push(id);
            }

            return challengerIds;
        })
        .then(function getMatches(challengerIds) {
            res.send(challengerIds);
        });


    // var url = 'https://na.api.pvp.net/api/lol/static-data/na/v1.2/champion?';
    // var query = {
    //     champData: 'image',
    //     api_key: key
    // };
    // var queryUrl = url + querystring.stringify(query);
    
    // request.get(queryUrl, function handleResp(err, resp, body) {
    //     if (err) {
    //         console.log(err);
    //         res.send("No");
    //     }
    //     else {
    //         var champs = JSON.parse(body).data;

    //         dataBuffer = [];

    //         for (champKey in champs) {
    //             var champ = champs[champKey];

    //             dataBuffer.push( { name: champ.name, image: 'http://ddragon.leagueoflegends.com/cdn/4.2.6/img/champion/' + champ.image.full } );
    //         }

    //         res.render('index.jade', { champs: dataBuffer });
    //     }

    // });
});

// Start up the server
app.listen(app.get('port'), function() {
    console.log("Active!");
});
