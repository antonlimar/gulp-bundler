import gulp from 'gulp';
import sass from 'sass';
import gulpSass from 'gulp-sass';
import autoprefixer from 'gulp-autoprefixer';
import groupMediaQueries from 'gulp-group-css-media-queries';
import includeFiles from 'gulp-include';
import gulpIf from 'gulp-if';
import terser from 'gulp-terser';
import cleanCSS from 'gulp-clean-css';
import sourcemaps from 'gulp-sourcemaps';
import browserSync from 'browser-sync';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { deleteSync } from 'del';

const { src, dest, parallel, series, watch } = gulp;
const { argv } = yargs(hideBin(process.argv));
const sassCompiler = gulpSass(sass);
const browserSyncInstance = browserSync.create();

const clean = async () => deleteSync('./public/', { force: true });

const styles = () => {
  return src('./src/styles/*')
    .pipe(gulpIf(argv.sourcemaps, sourcemaps.init()))
    .pipe(sassCompiler().on('error', sassCompiler.logError))
    .pipe(autoprefixer({ grid: true }))
    .pipe(groupMediaQueries())
    .pipe(gulpIf(argv.production, cleanCSS()))
    .pipe(gulpIf(argv.sourcemaps, sourcemaps.write('../maps')))
    .pipe(dest('./public/styles/'))
    .pipe(browserSyncInstance.stream());
};

const scripts = () => {
  return src('./src/scripts/*')
    .pipe(gulpIf(argv.sourcemaps, sourcemaps.init()))
    .pipe(
      includeFiles({
        includePaths: './src/components/**/',
      })
    )
    .pipe(gulpIf(argv.production, terser()))
    .pipe(gulpIf(argv.sourcemaps, sourcemaps.write('../maps')))
    .pipe(dest('./public/scripts/'))
    .pipe(browserSyncInstance.stream());
};

const copyFonts = () => {
  return src('./src/fonts/*').pipe(dest('./public/fonts/')).pipe(browserSyncInstance.stream());
};

const copyImages = () => {
  return src('./src/images/*').pipe(dest('./public/images/')).pipe(browserSyncInstance.stream());
};

const copyResources = async () => {
  copyFonts();
  copyImages();
};

const pages = () => {
  return src('./src/pages/*.html')
    .pipe(
      includeFiles({
        includePaths: './src/components/**/',
      })
    )
    .pipe(dest('./public/'))
    .pipe(browserSyncInstance.reload({ stream: true }));
};

const browserSynchronization = () => {
  browserSyncInstance.init({
    server: {
      baseDir: './public/',
      serveStaticOptions: {
        extensions: ['html'],
      },
    },
    port: 8080,
    ui: { port: 8081 },
    open: true,
  });
};

const watchDevelopment = () => {
  watch(['./src/pages/*.html', './src/components/**/*.html'], pages);
  watch(['./src/styles/*.scss', './src/components/**/*.scss'], styles);
  watch(['./src/scripts/*.js', './src/components/**/*.js'], scripts);
  watch(['./src/fonts/*'], copyFonts);
  watch(['./src/images/*'], copyImages);
};

const commonTasks = [clean, styles, scripts, copyResources, pages];

export const build = series(...commonTasks);

export default parallel(...commonTasks, browserSynchronization, watchDevelopment);
