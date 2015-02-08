var MongoClient = require('mongodb').MongoClient,
    promise     = require('./helpers/promisedFunctions');

var MONGO_URL = 'mongodb://bawjensen:dummypass@ds031531.mongolab.com:31531/heroku_app33050572';

function sendDataToDatabase() {
    promise.readJson('data-compiled/data.json')
        .then(function extractData(data) {
            return Object.keys(data).map(function(key) {
                var value = data[key];
                return { _id: key, games: value };
            });
        })
        .then(function connectToDatabase(mongoData) {
            return new Promise(function(resolve, reject) {
                MongoClient.connect(MONGO_URL, function callback(err, db) {
                    if (err) {
                        reject(Error(err));
                    }
                    else {
                        resolve({ db: db, collection: db.collection('champData'), mongoData: mongoData });
                    }
                });
            })
        })
        .then(function wipeAndInsert(obj) {
            var collection = obj.collection;
            var mongoData = obj.mongoData;
            var db = obj.db;

            collection.remove({}, function callback(err) {
                console.log(err ? err.stack : 'Remove success');

                collection.insert(mongoData, function callback(err) {
                    console.log(err ? err.stack : 'Write success');
                    db.close();
                });
            });
        })
        .catch(function(err) {
            console.log(err.stack);
        });
}

sendDataToDatabase();