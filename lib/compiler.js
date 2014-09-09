var es = require('event-stream');
var Renderer = require('stylus/lib/renderer');

function compile(stylus, code, callback) {
    if (stylus.options || stylus instanceof Renderer) {
        stylus.str = code;
        stylus.render(callback);
    } else {
        stylus.render(code, callback);
    }
}

module.exports = function(stylus) {
    return es.map(compile.bind(null, stylus));
};
