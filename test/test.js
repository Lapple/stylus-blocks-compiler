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
        flags: ['--include-css', '--resolve-url']
    }).pipe(process.stdout);
    test.done();
};
