var spawn = require('child_process').spawn;
var duplex = require('event-stream').duplex;

module.exports = function(flags) {
    var s = spawn('stylus', flags, {
        stdio: ['pipe', 'pipe', process.stderr]
    });

    return duplex(s.stdin, s.stdout);
};
