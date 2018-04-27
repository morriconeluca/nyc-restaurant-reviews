const gulp = require('gulp');
const imageResize = require('gulp-image-resize');
const imagemin = require('gulp-imagemin');
const rename = require('gulp-rename');
const del = require('del');

gulp.task( 'optimize-bitmaps', () => {
  for (let w = 3, q = 0.3; w < 8; w++) {
    optimizeBitmaps(w*100, q);
    q += 0.1;
  }
  return optimizeBitmaps(800, 0.8);
} );

function optimizeBitmaps(width, quality) {
  return gulp.src( 'img_src/*.{gif,jpeg,jpg,png}' )
    .pipe( imageResize( {
      width,
      imageMagick: true,
      filter: 'Catrom',
      quality
    } ) )
    .pipe( imagemin( [
      imagemin.gifsicle( { interlaced: true } ),
      imagemin.jpegtran( { progressive: true } ),
      imagemin.optipng( { optimizationLevel: 5 } )
    ] ) )
    .pipe( rename( ( path ) => {
      path.basename += `-${width}w`;
    } ) )
    .pipe( gulp.dest( './img' )
  );
}

gulp.task( 'clean', () => {
  return del( [ './img' ] );
} );

gulp.task( 'optimize-svgs', () => {
  return gulp.src( 'img_src/*.svg' )
    .pipe( imagemin( [
      imagemin.svgo( {
        plugins: [
            { removeViewBox: true },
            { cleanupIDs: false }
        ]
      })
    ] ) )
    .pipe( gulp.dest( './img' ) );
} );

gulp.task( 'default', gulp.series(
  'clean',
  gulp.parallel(
    'optimize-bitmaps',
    'optimize-svgs'
  )
) );
