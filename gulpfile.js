import gulp from 'gulp';
import sass from 'sass';
import gulpSass from 'gulp-sass';
import autoprefixer from 'gulp-autoprefixer';
import groupMediaQueries from 'gulp-group-css-media-queries';
import includeFiles from 'gulp-include';
import browserSync from 'browser-sync';
import { deleteSync } from 'del';

const { src, dest, parallel, series, watch } = gulp;
const sassCompiler = gulpSass(sass);
const browserSyncInstance = browserSync.create();

export const clean = async () => deleteSync('./public/', { force: true });

export const styles = () => {
  return src('./src/styles/*')
    .pipe(sassCompiler().on('error', sassCompiler.logError))
    .pipe(autoprefixer({ grid: true }))
    .pipe(groupMediaQueries())
    .pipe(dest('./public/styles/'))
    .pipe(browserSyncInstance.stream());
};

export const scripts = () => {
  return src('./src/scripts/index.js')
    .pipe(
      includeFiles({
        includePaths: './src/components/**/',
      })
    )
    .pipe(dest('./public/scripts/'))
    .pipe(browserSyncInstance.stream());
};

export const copyFonts = () => {
  return src('./src/fonts/*').pipe(dest('./public/fonts/')).pipe(browserSyncInstance.stream());
};

export const copyImages = () => {
  return src('./src/images/*').pipe(dest('./public/images/')).pipe(browserSyncInstance.stream());
};

export const copyResources = async () => {
  copyFonts();
  copyImages();
};

export const pages = () => {
  return src('./src/pages/*.html')
    .pipe(
      includeFiles({
        includePaths: './src/components/**/',
      })
    )
    .pipe(dest('./public/'))
    .pipe(browserSyncInstance.reload({ stream: true }));
};

export const browserSynchronization = () => {
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

export const watchDevelopment = () => {
  watch(['./src/pages/*.html', './src/components/**/*.html'], pages).on('change', browserSync.reload);
  watch(['./src/styles/*.scss', './src/components/**/*.scss'], styles).on('change', browserSync.reload);
  watch(['./src/scripts/*.js', './src/components/**/*.js'], scripts);
  watch(['./src/fonts/*'], copyFonts);
  watch(['./src/images/*'], copyImages);
};

const commonTasks = [clean, styles, scripts, copyResources, pages];

export const build = series(...commonTasks);

export default parallel(...commonTasks, browserSynchronization, watchDevelopment);
