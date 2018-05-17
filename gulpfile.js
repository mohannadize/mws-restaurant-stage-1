const gulp = require("gulp");
const sass = require("gulp-sass");
const autoprefix = require("gulp-autoprefixer");
const browserSync = require("browser-sync").create();

gulp.task("styles", function (done) {
    gulp.src("sass/**/*.scss")
        .pipe(sass().on("error", sass.logError))
        .pipe(autoprefix({
            browsers: ["last 2 versions"]
          }))
        .pipe(gulp.dest("./css"));
    done();
})
gulp.task("default", gulp.series("styles",function () {
    browserSync.init({
        server: "./"
    })
    gulp.watch("index.html").on('change', browserSync.reload);
    gulp.watch("js/**/*.js").on('change', browserSync.reload);
    gulp.watch("sass/**/*.scss").on("change", gulp.series("styles", browserSync.reload));
}));