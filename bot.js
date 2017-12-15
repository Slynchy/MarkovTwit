let TwitterBot = require('twit');
let Markov = require('markov-strings');

let MarkovBot = function(){
    "use strict";

    // ======+=+= PROPERTIES =+=+=======

    this.name = "MarkovBot";
    this.completed = [];
    this._bot = null;
    this._cfg = null;
    this._markov = null;
    this._lastTweetTimestamp = 0;
    this._nextTweetTimestamp = 0;
};

MarkovBot.prototype.log = function(str){
    "use strict";
    let output = "[MarkovBot] " + str;
    console.log(output);
    gl.sessionLog += (((new Date()).getTime()).toString() + " - " + (output + '\n'));
};

MarkovBot.prototype._constructTweet = function(char){
    "use strict";
    return char.string;
};

MarkovBot.prototype.initialize = function(){
    "use strict";
    this.log("Initializing...");
    let self = this;

    if(!gl.debugMode) {
        this._bot = new TwitterBot(gl.completedSaveDataJson[this.name]['cfg']);
        this._cfg = gl.completedSaveDataJson[this.name]['cfg'];
    }

    if(gl.completedSaveDataJson){
        this._lastTweetTimestamp = gl.completedSaveDataJson[this.name]['lastTweetStamp'];
        this._nextTweetTimestamp = gl.completedSaveDataJson[this.name]['nextTweetSchedule'];
    } else {
        this._lastTweetTimestamp = (new Date()).getTime();
        this._nextTweetTimestamp = (this._lastTweetTimestamp + (1000 * 60 * 60 * gl.tweetTimes));
    }

    setInterval(function(){self.update();}, 1000 * 60 * 10);

    this._markov = new Markov(gl.tweets, gl.markovOptions);
    this._markov.buildCorpusSync();
    this.log("Initialized!");
    this.update();
};

MarkovBot.prototype.tweet = function(){
    "use strict";
    let self = this;
    let char = this._markov.generateSentenceSync();

    this.log("Tweeting " + char);

    if(gl.debugMode === true) {
        this.log("Success!");
        self._lastTweetTimestamp = (new Date()).getTime();
        self._nextTweetTimestamp = (self._lastTweetTimestamp + (1000 * 60 * 60 * gl.tweetTimes));
        self.log("Next tweet scheduled for " + self._nextTweetTimestamp);
        return;
    }

    self._bot.post(
        'statuses/update',
        self._constructTweet(char),
        function(err, data, response) {
            if(err)
                self.log("Success!");
            else
                self.log("Failure!");
            self._lastTweetTimestamp = (new Date()).getTime();
            self._nextTweetTimestamp = (self._lastTweetTimestamp + (1000 * 60 * 60 * gl.tweetTimes));
            self.log("Next tweet scheduled for " + self._nextTweetTimestamp);
        }
    );
};

MarkovBot.prototype.update = function(){
    "use strict";
    this.log("Updating...");
    let currTime = (new Date()).getTime();
    if(currTime >= this._nextTweetTimestamp){
        this.tweet();
    }
};

module.exports = MarkovBot;