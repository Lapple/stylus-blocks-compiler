var fs = require('fs');
var path = require('path');
var LINEFEED = require('os').EOL;

var es = require('event-stream');
var join = require('join-stream');
var getCachedFilename = require('../util/get-cached-filename');

var CACHED = 1;
var ORIGINAL = 0;
var DEPENDANTS_MTIME = 0;

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

function chooseNewest(pair) {
    var index = isCacheValid(pair[CACHED], pair[ORIGINAL]) ? CACHED : ORIGINAL;
    return pair[index].filepath;
}

function source(filepath, callback) {
    if (isCSS(filepath)) {
        // TODO: Use file stream.
        fs.readFile(filepath, function(err, code) {
            callback(err, wrapInCSSLiteral(code));
        });
    } else {
        // Название функции для оборачивания создается
        // из пути до файла блока.
        var fn = filepath.replace(/[\/\.]/g, '_');

        var beginBlockLine = '/*! BEGIN_BLOCK:' + filepath + ' */';
        var endBlockLine = '/*! END_BLOCK:' + filepath + ' */';
        var importLine = '@import "' + filepath + '"';

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

function isCacheValid(cached, original) {
    return cached.stats && original.stats &&
        cached.stats.mtime > original.stats.mtime &&
        cached.stats.mtime > DEPENDANTS_MTIME;
}

function isCSS(filepath) {
    return path.extname(filepath.toLowerCase()) === '.css';
}

function wrapInCSSLiteral(code) {
    return [ '@css {', code, '}' ].join(LINEFEED);
}

module.exports = function(blocks) {
    return es.readArray(blocks)
        .pipe(es.mapSync(pair))
        .pipe(es.map(stats))
        .pipe(es.mapSync(chooseNewest))
        .pipe(es.map(source))
        .pipe(join(LINEFEED));
};
