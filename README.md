# LoLRunes

Order of events:

+ Get all challengers
+ Get match history for each
+ For each match, get champ, runes and masteries
+ Parse masteries, runes and find most popular
+ Assign that the associated champ

## Concepts, Plans and Intent

+ Easy to use
+ Fast
+ Everything visible on one screen

### Data

+ Dynamic Data
  + Gathered from API and store the past N games per champ
  + Stored in MongoDB on MongoLab
+ Static Data
  + Gathered from static source (ddragon) and preprocessed every patch
  + Stored as JSON files
