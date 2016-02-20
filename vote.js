var fs = require('fs');
var friends = require('../../core/friends');
var logger = require('../../core/logger.js');

var config;
if (fs.existsSync('./data/vote.json')) {
  config = JSON.parse(fs.readFileSync('./data/vote.json'));
} else {
  config = {
    name: 'duration',
    default: 1000 * 60
  }
}

var voters = [];
var yes = 0;
var no = 0;
var activeVote = false;
var removalTime = 0;
var vote = 'There is no active vote.';
var voteCreator;

// Handler.
exports.handle = function(input, source) {
  input = input.split(' ');
  if (input[0] == 'vote') {
    var now =  new Date().getTime();
    if (input.length == 1) {
      if (activeVote) {
        friends.messageUser(source, 'Current vote:  \"' + vote + '\". \nYes: ' + yes + '. \nNo: ' + no + '.  \nRemaining time to vote: ' + Math.floor((removalTime - now)/1000) + ' seconds.');
      }
      else if (!activeVote) {
        friends.messageUser(source, vote);
      }
    }
    else if (input.length > 2 && input[1].toLowerCase() == 'start') {
      if (activeVote) {
        friends.messageUser(source, 'There is already an active vote.  Will expire in: ' + Math.floor((removalTime - now)/1000) + ' seconds.');
      }
      else if (!activeVote) {
        input.splice(0, 2);
        vote = input.join(' ');
        friends.broadcast(source, friends.nameOf(source) + ' has started a vote: \"' + vote  + '\".' +
         '\nYou have ' + config.default/1000 + ' seconds to vote.' +
         '\n Type \"vote yes\" or \"vote no\" to vote now.');
        friends.messageUser(source, 'Okay starting a vote for: \"' + vote +'\"\n The vote will last for: '  + config.default/1000 + ' seconds.');
        removalTime = new Date().getTime() + config.default;
        voteCreator = source;
        voters.push(source);
        activeVote=true;
        setTimeout(function() {
          resetVoting();
        }, config.default);
      }
    }
    else if (input[1].toLowerCase() == 'yes') {
      if (hasAlreadyVoted(source)) {
        friends.messageUser(source, 'You can only vote once.');
      }
      else if (!hasAlreadyVoted(source)) {
        if (activeVote) {
          yes++;
          friends.messageUser(source, 'Recorded your vote for: YES. \nYes: ' + yes + '. \nNo: ' + no + '.');
          if (source != voteCreator) {
            voters.push(source);
          }
        }
        else if (!activeVote) {
          friends.messageUser(source, vote);
        }
      }
    }
    else if (input[1].toLowerCase() == 'no') {
      if (hasAlreadyVoted(source)) {
        friends.messageUser(source, 'You can only vote once.');
      }
      else if (!hasAlreadyVoted(source)) {
        if (activeVote) {
          no++;
          friends.messageUser(source, 'Recorded your vote for: NO. \nYes: ' + yes + '. \nNo: ' + no + '.');
          if (source != voteCreator) {
            voters.push(source);
          }
        }
        else if (!activeVote) {
          friends.messageUser(source, vote);
        }
      }
    }
    else if (input[1].toLowerCase() == 'duration') {
      if (friends.isAdmin(source)) {
        var newDuration = input.slice(2).join(' ');
        if (isNaN(newDuration)) {
          friends.messageUser(source, 'Duration should be a number, like 1, 15, 145, etc.');
        } else {
          setDuration(newDuration);
          friends.messageUser(source, 'Okay, the new duration is ' + newDuration + ' seconds.');
      }
      }
    }
    else {
      friends.messageUser(source, exports.getHelp());
    }
    return true;
  }
}

function resetVoting() {
  for (var voter in voters) {
    friends.messageUser(voters[voter], 'VOTE RESULTS for \"' + vote + '\"\n' +
      'Yes: ' + yes + '\n' +
      'No: ' + no + '\n');
  }
  yes = 0;
  no = 0;
  activeVote = false;
  vote = 'There is no active vote.';
  removalTime = 0;
  voters = [];
}

function hasAlreadyVoted(source) {
  for (var voter in voters) {
    if (voters[voter] == source) {
      return true;
    }
  }
  return false;
}

function setDuration(newDuration) {
  config.default = newDuration * 1000;
  save();
}

function save() {
  fs.writeFileSync('./data/vote.json', JSON.stringify(config));
}


exports.getHelp = function() {
  return '\nVOTE' + '\n--------\n' +
  'vote start [SOME VOTE HERE] - will start the vote\n' +
  'vote - shows the current item being voted on\n' +
  'vote yes - will add a vote for yes\n' +
  'vote no - will add a vote for no\n' +
  '*<ADMIN ONLY>* vote duration [DURATION] - sets the amount of time votes will last for\n';
}
