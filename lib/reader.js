var format = require('util').format;
var LINEFEED = require('os').EOL;

var es = require('event-stream');
var join = require('join-stream');

function wrap(filepath) {
    // Wrapper function name.
    var fn = filepath.replace(/[\/\.]/g, '_');
    var importLine = format('@import "%s"', filepath);

    return [
        fn + '()',
        '  __filename = "' + filepath + '"',
        '  ' + importLine,
        '',
        fn + '()',
        ''
    ].join(LINEFEED);
}

module.exports = function(blocks) {
    return es.readArray(blocks)
        .pipe(es.mapSync(wrap))
        .pipe(join(LINEFEED));
};
