const gulp = require("gulp");
const sass = require("gulp-sass");
const autoprefix = require("gulp-autoprefixer");
const browserSync = require("browser-sync").create();
const browserify = require("browserify");
const source = require('vinyl-source-stream');
const uglifycss = require('gulp-uglifycss');
const concat = require("gulp-concat");
const uglify = require("gulp-uglifyes");

gulp.task("styles", function () {
    return gulp.src("sass/**/*.scss")
        .pipe(sass().on("error", sass.logError))
        .pipe(autoprefix({
            browsers: ["last 2 versions"]
        }))
        .pipe(uglifycss({
            "maxLineLen": 500
        }))
        .pipe(gulp.dest("./build/css"));
});

gulp.task("idb-bundle", function () {
    return browserify('./js/idb.js')
        .bundle()
        .pipe(source('idb-bundled.js'))
        .pipe(gulp.dest('./build/'));
});

gulp.task("js", gulp.series("idb-bundle", function () {
    return gulp.src([
        "js/dbhelper.js",
        "js/main.js",
        "js/restaurant_info.js"
    ])
        .pipe(concat("app.js"))
        .pipe(uglify())
        .pipe(gulp.dest("./build/"))
}))
gulp.task("sw",function(){
    return gulp.src(["sw.js","manifest.json"])
        .pipe(gulp.dest("./build/"));
})
gulp.task("html", function () {
    return gulp.src("*.html")
        .pipe(gulp.dest("./build/"));
})
gulp.task("build", gulp.series("html","sw", "styles", "js"), e => { e() });
gulp.task("default", gulp.series("html","sw", "styles", "js", function () {
    browserSync.init({
        server: "./build/"
    })
    gulp.watch("*.html").on('change', gulp.series("html", browserSync.reload));
    gulp.watch([
        "js/idb.js",
        "js/dbhelper.js",
        "js/main.js",
        "js/restaurant_info.js"
    ]).on('change', gulp.series("js", browserSync.reload));
    gulp.watch("sass/**/*.scss").on("change", gulp.series("styles", browserSync.reload));
    gulp.watch("sw.js").on("change", gulp.series("sw", browserSync.reload));
}));