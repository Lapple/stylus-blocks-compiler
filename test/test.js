var compiler = require('../index.js');

exports.compiles = function(test) {
    compiler({
        blocks: [
            'test/fixtures/button.styl',
            'test/fixtures/input.styl'
        ],
        dependants: [
            'package.json'
        ],
        output: 'test/comp.styl',
        flags: ['--include-css', '--resolve-url']
    });
    test.done();
};
