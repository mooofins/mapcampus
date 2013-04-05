'use strict';

(function() {
  var wnd = $(window);
  var navbar = $(".navbar");
  var center = $("#center");

  var resize = function() {
    var nh = navbar.height();
    center.height(wnd.height() - nh);
  }

  $(wnd).resize(resize);
  $(wnd).load(resize);
})();

// AngularJS stuff
angular.module('mc', ['mcServices'])
  .config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');
  });