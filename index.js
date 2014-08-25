var _ = require('lodash');
var fs = require('fs');

var reader = require('./lib/reader');
var cacher = require('./lib/cacher');
var compiler = require('./lib/compiler');

module.exports = function(params) {
    var options = _.defaults(params, {
        blocks: [],
        dependants: [],
        stylus: require('stylus')
    });

    var dependantsMtime = getLatestModificationTime(options.dependants);

    var reading = reader(options.blocks, dependantsMtime);
    var compilation = reading.pipe(compiler(options.stylus));

    compilation.pipe(cacher(options.blocks));

    return compilation;
};

function getLatestModificationTime(filepaths) {
    return _.max(_.pluck(_.map(filepaths, fs.statSync), 'mtime'));
}
