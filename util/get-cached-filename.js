var path = require('path');
var dirname = path.dirname;
var basename = path.basename;

module.exports = function(filepath) {
    return path.join(dirname(filepath), '.' + basename(filepath) + '.compiled.css');
};
