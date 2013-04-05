'use strict';

function MapCtrl($scope, Buildings, Routes, GoogleMapService) {
  $scope.map = GoogleMapService;
  $scope.routes = null;

  $scope.search = function(from, to) {
    var payload = Routes.get({ from_id: from, to_id: to, limit: 200 }, function() {
      if ($scope.route != null) {
        $scope.route.erase();
      }

      var nodes = $.map(payload.objects, function(obj) {
        var coords = obj.coordinates.coordinates;
        return new Node($scope.map, obj.id, [coords[1], coords[0]]);
      });

      $scope.route = new Route($scope.map, nodes);
      $scope.route.draw();
    });
  }
}