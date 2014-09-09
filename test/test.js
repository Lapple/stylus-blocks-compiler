var compiler = require('../index.js');

exports.compiles = function(test) {
    compiler({
        blocks: [
            'test/fixtures/button.styl',
            'test/fixtures/input.styl'
        ]
    })
    .on('end', test.done)
    .pipe(process.stdout);
};
