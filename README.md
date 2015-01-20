# LoL Runes and Masteries

Created and designed by @bawjensen and @dshelts. 


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
  + What: Runes and Masteries 
  + How much: Past N games per champ
  + Where from: Gathered from API
  + Where to: Stored in MongoDB on MongoLab
+ Static Data
  + What: Everything about the game (descriptional data, champ names, rune effects, etc.)
  + How much: All of it
  + Where from: Gathered from static source (ddragon) and preprocessed every patch
  + Where to: Stored server-side as JSON files
