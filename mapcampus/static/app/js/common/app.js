'use strict';

// AngularJS stuff
angular.module('mc', ['mcServices'])
  .config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');
  });