var MongoClient = require('mongodb').MongoClient,
    promise     = require('./helpers/promisedFunctions');

var MONGO_URL = 'mongodb://bawjensen:dummypass@ds031531.mongolab.com:31531/heroku_app33050572';

function sendDataToDatabase() {
    promise.readJson('data-compiled/data.json')
        .then(function saveData(data) {
            var mongoData = Object.keys(data).map(function(key) {
                var value = data[key];
                return { _id: key, games: value };
            });

            // mongoData = mongoData.concat.apply([], mongoData);

            MongoClient.connect(MONGO_URL, function callback(err, db) {
                var collection = db.collection('champData');

                collection.remove({}, function callback(err) {
                    console.log(err ? err.stack : 'Remove success');

                    console.log(mongoData);

                    collection.insert(mongoData, function callback(err) {
                        console.log(err ? err.stack : 'Write success');
                    });
                });
            });
        })
        .catch(function(err) {
            console.log(err.stack);
        });
}

sendDataToDatabase();