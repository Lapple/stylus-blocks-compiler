var fs = require('fs');
var LINEFEED = require('os').EOL;

var _ = require('lodash');
var async = require('async');

var cacher = require('./lib/cacher');
var compiler = require('./lib/compiler');
var getCachedFilename = require('./util/get-cached-filename');

module.exports = function(params) {
    var options = _.defaults(params, {
        blocks: [],
        dependants: [],
        wrap: true,
        flags: []
    });

    var DEPENDANTS_MTIME = getLatestModificationTime(options.dependants);

    async.map(options.blocks, getBlockCode, function(err, styles) {
        if (err) {
            throw err;
        }

        var comp = compiler(options.flags);

        comp.pipe(fs.createWriteStream(options.output));
        comp.pipe(cacher(options.blocks));
        comp.end(styles.join(LINEFEED));
    });

    function getBlockCode(filepath, done) {
        var cached = getCachedFilename(filepath);

        async.map(_.compact([filepath, cached]), fs.stat, function(err, stats) {
            if (isCacheValid(stats[0], stats[1])) {
                readFile(cached, function(err, code) {
                    done(err, wrapInCSSLiteral(code));
                });
            } else {
                // Название функции для оборачивания создается
                // из пути до файла блока.
                var fn = filepath.replace(/[\/\.]/g, '_');

                var beginBlockLine = '/*! BEGIN_BLOCK:' + filepath + ' */';
                var endBlockLine = '/*! END_BLOCK:' + filepath + ' */';
                var importLine = '@import "' + filepath + '"';
                var code;

                if (options.wrap) {
                    code = [
                        fn + '()',
                        '  ' + beginBlockLine,
                        '  __filename = "' + filepath + '"',
                        '  ' + importLine,
                        '  ' + endBlockLine,
                        '',
                        fn + '()',
                        ''
                    ];
                } else {
                    code = [
                        beginBlockLine,
                        importLine,
                        endBlockLine,
                        ''
                    ];
                }

                done(null, code.join(LINEFEED));
            }
        });
    }

    function isCacheValid(original, cached) {
        return cached && original &&
            cached.mtime.getTime() > original.mtime.getTime() &&
            cached.mtime.getTime() > DEPENDANTS_MTIME.getTime();
    }
};

function wrapInCSSLiteral(code) {
    return [ '@css {', code, '}' ].join(LINEFEED);
}

function readFile(filepath, done) {
    fs.readFile(filepath, { encoding: 'utf8' }, done);
}

function getLatestModificationTime(filepaths) {
    return _.min(_.pluck(_.map(filepaths, fs.statSync), 'mtime'));
}
