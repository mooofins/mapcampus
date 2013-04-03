'use strict';

var module = angular.module('mc', ['mcServices']);

module.directive('loadBtn', function() {
  return {
    require: 'ngModel',
    restrict: 'A',

    link: function(scope, element, attrs, model) {
      scope.$watch(
        'loading',
        function(nv, ov) {
          if (nv) {
            element.button('loading');
          } else {
            element.button('reset');
          }
        }
      );
    }
  };
});
