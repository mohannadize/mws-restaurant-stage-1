const gulp = require("gulp");
const sass = require("gulp-sass");
const autoprefix = require("gulp-autoprefixer");
const browserSync = require("browser-sync").create();
const browserify = require("browserify");
const source = require('vinyl-source-stream');
const uglifycss = require('gulp-uglifycss');

gulp.task("styles", function (done) {
    gulp.src("sass/**/*.scss")
        .pipe(sass().on("error", sass.logError))
        .pipe(autoprefix({
            browsers: ["last 2 versions"]
        }))
        .pipe(uglifycss({
            "maxLineLen":500
        }))
        .pipe(gulp.dest("./css"));
    done();
});
gulp.task("idb-bundle", function (done) {
    return browserify('./js/idb.js')
        .bundle()
        .pipe(source('idb.js'))
        .pipe(gulp.dest('./'));
});

gulp.task("default", gulp.series("styles", "idb-bundle", function () {
    browserSync.init({
        server: "./"
    })
    gulp.watch("index.html").on('change', browserSync.reload);
    gulp.watch("js/**/*.js").on('change', gulp.series("idb-bundle", browserSync.reload));
    gulp.watch("sass/**/*.scss").on("change", gulp.series("styles", browserSync.reload));
}));