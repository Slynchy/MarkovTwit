// VARIABLES

let fs = require("fs");
let MarkovBot = require("./bot.js");
let csv = require("csv");

global.gl = {
    CLOSING: false,
    debugMode: false,
    ignoreRetweets: true,
    ignoreReplies: true,
    bots: {
        bot: null,
    },
    tweets: [], // unneeded now
    _tweetsStr: "",
    completedSaveDataJson: null,
    sessionLog: "\n",
    markovOptions: {
        maxLength: 280,
        minWords: 3,
        minScore: 120,
        maxTries: 10000 * 5
    },
    tweetTimes: 3// in hours
};

// STARTUP

init();

// FUNCTIONS

function init(){
    if(fs.existsSync("botSettings.json")){
        gl.completedSaveDataJson = JSON.parse(fs.readFileSync("botSettings.json", "utf8"));
    } else {
        gl.completedSaveDataJson = null;
    }

    if(fs.existsSync("tweets.txt")){
        log("tweets.txt found; loading...");
        gl._tweetsStr = fs.readFileSync("tweets.txt", "utf8");
        gl.tweets = gl._tweetsStr.split('\n');
        CreateBot();
    } else if(fs.existsSync("tweets.csv")) {
        log("tweets.csv found; created plaintext file...");
        LoadParseCSV(CreateBot);
    } else {
        log("FATAL! No tweets.csv!");
        process.exit();
    }
}

function LoadParseCSV(callback){
    csv.parse(fs.readFileSync("tweets.csv", "utf8"), function(err, data) {
        for(let i = 0; i < data.length; i++){

            if(gl.ignoreRetweets && data[i][5][0] === 'R' && data[i][5][1] === 'T'){
                continue;
            }

            if(gl.ignoreReplies && data[i][5][0] === '@'){
                continue;
            }

            gl.tweets.push(data[i][5]);
        }

        for(let i = 0; i < gl.tweets.length; i++){
            gl._tweetsStr += gl.tweets[i] + "\n";
        }

        fs.writeFileSync("tweets.txt", gl._tweetsStr);

        callback();
    });
}

function CreateBot(){
    gl.bots.bot = new MarkovBot();
    gl.bots.bot.initialize();
}

function log(str){
    let output = "[TwitMarkov] " + str;
    console.log(output);
    gl.sessionLog += (((new Date()).getTime()).toString() + " - " + (output + '\n'));
}

function exitHandler(){
    if(gl.CLOSING) return;
    gl.CLOSING = true;

    log("Saving schedules...");
    let completedOutput = {};
    for(let k in gl.bots){
        if(gl.bots.hasOwnProperty(k) && gl.bots[k]){
            let bot = gl.bots[k];
            completedOutput[bot.name] = {};
            completedOutput[bot.name].lastTweetStamp = bot._lastTweetTimestamp;
            completedOutput[bot.name].nextTweetSchedule = (bot._nextTweetTimestamp);
            completedOutput[bot.name].cfg = (bot._cfg);
        }
    }
    fs.writeFileSync("botSettings.json", JSON.stringify(completedOutput), "utf8");

    log('Exiting...');
    fs.writeFileSync(((new Date()).getTime()).toString()+".txt", gl.sessionLog);
    process.exit();
}

process.on('uncaughtException', function(e) {
    log('\nUncaught Exception!!\n');
    log(e.stack);
    process.exit();
});
process.on('exit', exitHandler.bind(null, null));
process.on('SIGINT', exitHandler.bind(null, null));