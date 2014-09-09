var _ = require('lodash');

var reader = require('./lib/reader');
var compiler = require('./lib/compiler');

module.exports = function(params) {
    var options = _.defaults(params, {
        blocks: [],
        stylus: require('stylus')
    });

    return reader(options.blocks).pipe(compiler(options.stylus));
};
