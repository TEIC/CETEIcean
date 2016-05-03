// Dependencies
const gulp  = require('gulp'),
    gutil = require('gulp-util'),
    rename = require('gulp-rename'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    babelify = require('babelify'),
    connect = require('gulp-connect')

gulp.task('build:es6', function() {
    return browserify({
        entries: './src/CETEI.js',
        debug: true
    })
    .transform("babelify", {presets: ['es2015']})
    .bundle()
    .on('error', function (err) {
        gutil.log("Error : " + err.message);
        this.emit('end'); // This is needed for the watch task, or it'll hang on error
    })
    .pipe(source('CETEI.js'))
    .pipe(buffer())
    .pipe(gulp.dest('dist/'));
});

gulp.task('watch', function() {
    gulp.watch('src/**/*.js', ['build:es6']);
});

gulp.task('webserver', function() {
  connect.server({livereload: true, port: 8888});
});

gulp.task('default', ['build:es6']);
gulp.task('dev', ['webserver', 'build:es6', 'watch']);
