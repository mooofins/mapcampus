'use strict';

/* jasmine specs for controllers go here */
describe('Home Controllers', function() {

  beforeEach(function() {
    this.addMatchers({
      toEqualData: function(expected) {
        return angular.equals(this.actual, expected);
      }
    });
  });

  beforeEach(module('mcServices'));

  describe('MapCtrl', function() {
    var scope, ctrl, $httpBackend;

    beforeEach(inject(function(_$httpBackend_, $rootScope, $controller) {
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('/api/v1/route?format=json&from_id=1&limit=200&to_id=4')
        .respond({
          meta: {
            limit: 20, next: null, offset: 0, previous: null, total_count: 2
          }, objects: [{
              coordinates : {coordinates: [-88.22836, 40.109295], type: "Point"},
              id: 45, 
            }, {
              coordinates: {coordinates: [-88.22810251097272, 40.10916663656381], type: "Point"},
              id: 51, 
            }]
        });

      scope = $rootScope.$new();
      ctrl = $controller(MapCtrl, {
        $scope: scope, 
        GoogleMapService: jasmine.createSpyObj(
          'GoogleMapService',
          ['addListener', 'addGlobalListener', 'drawPolyline', 'drawMarker', 'drawCircle', 'fitBoundsToPolyline']
        )
      });
    }));

    it('Verify route has right number of nodes and correct coordinates.', function() {
      scope.search(1, 4); $httpBackend.flush();

      var n1 = scope.route.nodes[0];
      var n2 = scope.route.nodes[1];

      expect(scope.route.nodes.length).toEqual(2);
      expect(n1.coordinates).toEqualData([40.109295, -88.22836]);
      expect(n2.coordinates).toEqualData([40.10916663656381, -88.22810251097272]);
    });

    it('Should call appropriate draw methods.', function() {
      scope.search(1, 4); $httpBackend.flush();

      expect(scope.map.drawMarker).toHaveBeenCalled();
      expect(scope.map.drawPolyline).toHaveBeenCalled();
    });
  });
});
