var bodyParser  = require("body-parser"),
    express     = require("express"),
    logfmt      = require("logfmt");

var app = express();

// Server defaults to port 7500
app.set('port', (process.env.PORT || 5000));

// Static serving files from specific folders
app.use('/foundation',  express.static(__dirname + '/foundation'));
app.use('/css',         express.static(__dirname + '/css'));
app.use('/js',          express.static(__dirname + '/js'));
app.use('/images',      express.static(__dirname + '/images'));
app.use('/static',      express.static(__dirname + '/static'));

// Other stuff to use
app.use(logfmt.requestLogger());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req, res) {
    res.render('index.jade');
});

// Start up the server
app.listen(app.get('port'), function() {
    console.log("Listening on " + app.get('port'));
});
