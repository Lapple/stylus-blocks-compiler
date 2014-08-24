var fs = require('fs');
var Writable = require('stream').Writable;

var _ = require('lodash');
var async = require('async');
var getCachedFilename = require('../util/get-cached-filename');

module.exports = function(blocks) {
    var ws = Writable();

    ws._write = function(chunk, enc, next) {
        async.map(blocks, _.partial(cacheBlock, chunk), next);
    };

    return ws;
}

function cacheBlock(css, filepath, next) {
    var block = getBlockCSSRegExp(filepath).exec(css);

    if (block) {
        fs.writeFile(getCachedFilename(filepath), block[0].trim(), next);
    } else {
        next();
    }
}

function getBlockCSSRegExp(filepath) {
    return new RegExp([
        '\\/\\* BEGIN_BLOCK:',
        escapeForRegExp(filepath),
        ' \\*\\/([^]*)\\/\\* END_BLOCK:',
        escapeForRegExp(filepath),
        ' \\*\\/'
    ].join(''), 'g');
}

function escapeForRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
