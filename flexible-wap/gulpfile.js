var gulp = require('gulp'),
    connect = require('gulp-connect'),
    less = require('gulp-less'),
    cssmin = require('gulp-minify-css');
 
gulp.task('webserver', function() {
    connect.server({
    	// root: "dist",
        livereload: true,
        port: 2000,
        open: true,
        host: '0.0.0.0',
        livereload: true
    });
});

gulp.task('less', function () {
    gulp.src('css/*.less')
        .pipe(less())　　
        .pipe(cssmin())      
        .pipe(gulp.dest('css'))
        .pipe(connect.reload());

     gulp.watch('./css/*.less',['less']);
});
 
gulp.task('default', ['webserver', 'less']);
