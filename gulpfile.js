const gulp = require('gulp'),
  sourcemaps = require('gulp-sourcemaps'),
  babel = require('gulp-babel'),
  uglify = require('gulp-uglify'),
  htmlmin = require('gulp-htmlmin'),
  sass = require('gulp-sass'),
  critical = require('critical').stream,
  webp = require('gulp-webp'),
  imageResize = require('gulp-image-resize'),
  imagemin = require('gulp-imagemin'),
  rename = require('gulp-rename'),
  del = require('del');

gulp.task('minify-js', () => {
  return gulp.src('src/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(uglify({ mangle: {reserved: ['initMap', 'ClientError']} }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist'));
});

gulp.task('minify-html', () => {
  return gulp.src('src/*.{html,htm}')
    .pipe(htmlmin({
      collapseWhitespace: true,
      conservativeCollapse: true,
      removeComments: true,
      minifyJS: true
    }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('sass', () => {
  return gulp.src('src/scss/*.scss')
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(gulp.dest('src/css'));
});

gulp.task('critical', () => {
  return gulp.src('dist/*.html')
      .pipe(critical({
        base: 'dist/',
        inline: true,
        minify: true,
        css: ['dist/css/styles.css']
      }))
      .pipe(gulp.dest('dist'));
});

gulp.task('optimize-bitmaps', () => {
  for (let w = 3, q = 0.3; w < 8; w++, q += 0.1) {
    optimizeBitmaps(w*100, q);
  }
  return optimizeBitmaps(800, 0.8);
});

function optimizeBitmaps(width, quality) {
  return gulp.src('src/img_src/*.{gif,jpeg,jpg,png}')
    .pipe(imageResize({
      width,
      imageMagick: true,
      filter: 'Catrom',
      quality
    }))
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.jpegtran({progressive: true}),
      imagemin.optipng({optimizationLevel: 5})
    ]))
    .pipe(rename(path => {
      path.basename += `-${width}w`;
    }))
    .pipe(gulp.dest('src/img')
  );
}

gulp.task('optimize-svgs', () => {
  return gulp.src('src/img_src/*.svg')
    .pipe(imagemin([
      imagemin.svgo({
        plugins: [
            {removeViewBox: true},
            {cleanupIDs: false}
        ]
      })
    ]))
    .pipe(gulp.dest('src/img'));
});

gulp.task('png-to-webp', () => {
  return gulp.src('src/img/*.png')
    .pipe(webp({lossless: true}))
    .pipe(gulp.dest('src/img'));
});

gulp.task('jpg-to-webp', () => {
  return gulp.src('src/img/*.{jpeg,jpg}')
    .pipe(webp({quality: 65}))
    .pipe(gulp.dest('src/img'));
});

gulp.task('clean-src-img', () => {
  return del(['src/img']);
});

gulp.task('clean-dist', () => {
  return del(['./dist']);
});

gulp.task('copy-css', () => {
  return gulp.src('src/css/*.css')
    .pipe(gulp.dest('dist/css'));
});

gulp.task('copy-img', () => {
  return gulp.src('src/img/*.{gif,jpeg,jpg,png,svg,webp}')
    .pipe(gulp.dest('dist/img'));
});

gulp.task('copy-favicon', () => {
  return gulp.src('src/*.ico')
    .pipe(gulp.dest('./dist'));
});

gulp.task('build-src', gulp.series(
  'clean-src-img',
  gulp.parallel(
    'optimize-bitmaps',
    'optimize-svgs'
  ),
  gulp.parallel(
    'png-to-webp',
    'jpg-to-webp'
  )
));

gulp.task('default', gulp.series(
  gulp.parallel(
    'build-src',
    'clean-dist',
  ),
  gulp.parallel(
    'minify-js',
    'minify-html',
    'copy-css',
    'copy-img',
    'copy-favicon'
  ),
  'critical'
));
