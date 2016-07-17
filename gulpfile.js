var gulp = require('gulp'),
  uglify = require('gulp-uglifyjs'),
  buffer = require('vinyl-buffer'),
  sass = require('gulp-sass'),
  sourcemaps = require('gulp-sourcemaps'),
  autoprefixer = require('gulp-autoprefixer'),
  gutil = require('gulp-util');


var config = {
  sass_path_watch: ['src/sass/*.sass', 'src/sass/**/*.sass'],
  sass_path_from: 'src/sass/*.sass',
  scripts_path_watch: ['src/js/*.js', 'src/js/**/*.js'],
  scripts_path_from: ['src/js/*.js'],
};


gulp.task('build:sass', function() {
  return gulp.src(config.sass_path_from)
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', function(err) {
      var displayErr = gutil.colors.red(err);
      gutil.log(displayErr);
      gutil.beep();
      this.emit('end');
    }))
    .pipe(autoprefixer({
      browsers: ['last 3 versions'],
      cascade: false
    }))
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist/css'));
  //.pipe(gulp.dest(conf.sass_path_dest + '/tmp'));
});

gulp.task('build:scripts', function(){
  return gulp.src(config.scripts_path_from)
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest(__dirname + "/dist/js/"));
});

gulp.task('watch', function() {
  gulp.watch(config.scripts_path_watch, ['build:scripts']);
  gulp.watch(config.sass_path_watch, ['build:sass']);
});

gulp.task('default', ['build:scripts', 'build:sass', 'watch']);
