var _ = require('lodash');
var fs = require('fs');

var reader = require('./lib/reader');
var cacher = require('./lib/cacher');
var compiler = require('./lib/compiler');

module.exports = function(params) {
    var options = _.defaults(params, {
        blocks: [],
        dependants: [],
        flags: []
    });

    var DEPENDANTS_MTIME = getLatestModificationTime(options.dependants);
    var comp = reader(options.blocks).pipe(compiler(options.flags));

    comp.pipe(fs.createWriteStream(options.output));
    comp.pipe(cacher(options.blocks));
};

function getLatestModificationTime(filepaths) {
    return _.max(_.pluck(_.map(filepaths, fs.statSync), 'mtime'));
}
