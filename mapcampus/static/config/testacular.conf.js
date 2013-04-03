basePath = '../';

files = [
  JASMINE,
  JASMINE_ADAPTER,
  'app/lib/angular/angular.js',
  'app/lib/angular/angular-*.js',
  'app/lib/jquery/*.js',
  'app/lib/bootstrap/**/*.js',
  'test/lib/angular/angular-mocks.js',
  'test/unit/**/services.js',
  'test/unit/**/*.js',
  'app/js/**/models.js',
  'app/js/**/*.js',
];

autoWatch = true;

browsers = ['Chrome'];

junitReporter = {
  outputFile: 'test_out/unit.xml',
  suite: 'unit'
};
