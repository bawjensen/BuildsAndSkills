var bodyParser  = require("body-parser"),
    express     = require("express"),
    fs          = require("fs"),
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

// Other stuff to use
app.use(logfmt.requestLogger());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', function(req, res) {
    promiseReadJsonFile('data/champData.json')
        .then(function readStaticData(dynamicChampData) {
            return new Promise(function read(resolve, reject) {
                promiseReadJsonFile('data/dragontail/4.21.4/data/en_US/champion.json')
                    .then(function resolveWithBoth(staticChampData) {
                        resolve({ staticChampData: staticChampData, dynamicChampData: dynamicChampData })
                    });
            });
        })
        .then(function display(allChampData) {
            var champData = allChampData.dynamicChampData;

            var staticChampsObj = allChampData.staticChampData.data;

            for (key in staticChampsObj) {
                var staticChampObj = staticChampsObj[key];

                var champNumberId = staticChampObj.key;
                var champStringId = staticChampObj.id;

                if (!(champNumberId in champData)) {
                    console.log(champStringId + ' wasn\'t played');
                    // res.send(champData);
                }
                else {
                    champData[champNumberId].name = champStringId;
                }
            }

            res.render('index.jade', { champData: champData });
        }).catch(function handleError(err) {
            res.send(err.stack);
        });
});

// Start up the server
app.listen(app.get('port'), function() {
    console.log("Active!");
});
