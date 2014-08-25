var fs = require('fs');
var path = require('path');
var format = require('util').format;
var LINEFEED = require('os').EOL;

var es = require('event-stream');
var join = require('join-stream');
var getCachedFilename = require('../util/get-cached-filename');

var CACHED = 1;
var ORIGINAL = 0;

function stat(filepath, callback) {
    fs.stat(filepath, function(err, stats) {
        // Do not throw errors on missing files.
        callback(null, {
            stats: stats,
            filepath: filepath
        });
    });
}

function stats(pair, callback) {
    es.readArray(pair).pipe(es.map(stat)).pipe(es.writeArray(callback));
}

function pair(filepath) {
    return [filepath, getCachedFilename(filepath)];
}

function chooseNewest(pair, dependantsMtime) {
    if (!pair[CACHED].stats) {
        return pair[ORIGINAL].filepath;
    }

    if (pair[CACHED].stats.mtime <= dependantsMtime) {
        return pair[ORIGINAL].filepath;
    }

    return pair[isCached(pair[CACHED], pair[ORIGINAL]) ? CACHED : ORIGINAL].filepath;
}

function source(filepath, callback) {
    if (isCSS(filepath)) {
        fs.readFile(filepath, function(err, code) {
            callback(err, wrapInCSSLiteral(code));
        });
    } else {
        // Wrapper function name.
        var fn = filepath.replace(/[\/\.]/g, '_');

        var beginBlockLine = format('/*! BEGIN_BLOCK:%s */', filepath);
        var endBlockLine = format('/*! END_BLOCK:%s */', filepath);
        var importLine = format('@import "%s"', filepath);

        callback(null, [
            fn + '()',
            '  ' + beginBlockLine,
            '  __filename = "' + filepath + '"',
            '  ' + importLine,
            '  ' + endBlockLine,
            '',
            fn + '()',
            ''
        ].join(LINEFEED));
    }
}

function isCached(cached, original) {
    return cached.stats.mtime > original.stats.mtime;
}

function isCSS(filepath) {
    return path.extname(filepath.toLowerCase()) === '.css';
}

function wrapInCSSLiteral(code) {
    return [ '@css {', code, '}' ].join(LINEFEED);
}

module.exports = function(blocks, dependantsMtime) {
    return es.readArray(blocks)
        .pipe(es.mapSync(pair))
        .pipe(es.map(stats))
        .pipe(es.mapSync(chooseNewest, dependantsMtime))
        .pipe(es.map(source))
        .pipe(join(LINEFEED));
};
