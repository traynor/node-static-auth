// Gulpfile.js
const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const Cache = require('gulp-file-cache');
const mocha = require('gulp-mocha');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();

var cache = new Cache();

const src = './src/**/*.js';
const dest = 'lib';
const test = 'example';

gulp.task('lint', function() {
    return gulp.src([src, test])
        .pipe(eslint())
        .pipe(eslint.format());
});


gulp.task('compile', ['lint'], function() {
    var stream = gulp.src(src) // your ES2015 code
        .pipe(sourcemaps.init())
        //.pipe(cache.filter()) // remember files
        // leave out presets here, breaks `add-module-exports` plugin
        .pipe(babel()) // compile new ones
        .pipe(sourcemaps.write('.', {
            includeContent: false,
            sourceRoot: '../src'
        }))
        //.pipe(cache.cache()) // cache them
        .pipe(gulp.dest(dest)) // write them
    return stream // important for gulp-nodemon to wait for completion
});

gulp.task('test-custom', ['compile'], function() {
    const stream = gulp.src(['lib/custom.spec.js'])
        .pipe(mocha({
            reporter: 'list',
            // prevent from hanging on callback
            exit: true
        }))
        .once('error', (err) => {
            process.exit(1);
        })
        .once('end', () => {
            //process.exit();
        });
    return stream;
});

// todo: fix ugly workaround for test order
gulp.task('test', ['test-custom'], function() {
    const stream = gulp.src(['lib/integration.spec.js'])
        .pipe(mocha({
            reporter: 'list',
            // prevent from hanging on callback
            exit: true
        }))
        .once('error', (err) => {
            process.exit(1);
        })
        .once('end', () => {
            //process.exit();
        });
    return stream;
});

gulp.task('server', ['test'], function() {

    var stream = nodemon({
            script: 'example/server', // run ES5 code
            ext: 'js, html',
            watch: ['src', 'test', 'example'], // watch ES2015 code
            tasks: ['test'] // compile synchronously onChange
        })
        .on('restart', function() {
            /* eslint-disable no-console */
            console.log('nodemon restarted');
            /* eslint-enable no-console */
        })
        .on('start', function() {
            /* eslint-disable no-console */
            console.log('nodemon started');
            /* eslint-enable no-console */

            // use start event to reload browsers
            // also: "browser-sync" only works when there is the tag "body"
            browserSync.reload();
        })
        .on('crash', function() {
            /* eslint-disable no-console */
            console.error('nodemon crashed!\n');
            /* eslint-enable no-console */
            // emitting causes to run task, crashes nodemon
            //stream.emit('restart', 10) // restart the server in 10 seconds
        });

    return stream;
})

gulp.task('browser-sync', ['server'], function() {
    // todo: http/2 workaround
    browserSync.init({
        port: 3003,
        // todo: const
        proxy: "https://localhost:3001",
        //browser: 'firefox',
        ui: {
            port: 8080
        },
        reloadDelay: 1000
    });
});

gulp.task('no-bs', ['server'], function() {});

gulp.task('default', ['browser-sync']);
