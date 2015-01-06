var bodyParser  = require("body-parser"),
    express     = require("express"),
    logfmt      = require("logfmt"),
    request     = require("request");

var app = express();

// Server defaults to port 7500
app.set('port', (process.env.PORT || 5000));

// Static serving files from specific folders
// app.use('/foundation',  express.static(__dirname + '/foundation'));
// app.use('/css',         express.static(__dirname + '/css'));
// app.use('/js',          express.static(__dirname + '/js'));
// app.use('/images',      express.static(__dirname + '/images'));
// app.use('/static',      express.static(__dirname + '/static'));

// Other stuff to use
app.use(logfmt.requestLogger());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req, res) {
    request.get('https://na.api.pvp.net/api/lol/static-data/na/v1.2/champion?champData=image&api_key=19deda21-b9ca-40d3-af2c-5037a30b37b9', function handleResp(err, resp, body) {
        if (err) {
            console.log(err);
            res.send("No");
        }
        else {
            var champs = JSON.parse(body).data;

            dataBuffer = [];

            for (champKey in champs) {
                var champ = champs[champKey];

                dataBuffer.push( { name: champ.name, image: 'http://ddragon.leagueoflegends.com/cdn/4.2.6/img/champion/' + champ.image.full } );
            }

            res.render('index.jade', { champs: dataBuffer });
        }
    });
    // res.render('index.jade');
});

// Start up the server
app.listen(app.get('port'), function() {
    console.log("Active!");
});
