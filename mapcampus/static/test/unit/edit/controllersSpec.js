'use strict';

/* jasmine specs for controllers go here */
describe('Edit Controllers', function() {
  var nodesPayload = {
    meta: {
      limit: 5000, next: null, offset: 0, previous: null, total_count: 3
    }, objects: [
      {
        coordinates : {coordinates: [1, 1], type: "Point"},
        id: 1, 
        resource_uri: "/api/v1/node/1/"
      }, {
        coordinates: {coordinates: [2, 2], type: "Point"},
        id: 2, 
        resource_uri: "/api/v1/route/2/"
      }, {
        coordinates: {coordinates: [3, 3], type: "Point"},
        id: 3, 
        resource_uri: "/api/v1/route/3/"
      }
    ]
  };

  var edgesPayload = {
    meta: {
      limit: 5000, next: null, offset: 0, previous: null, total_count: 2
    }, objects: [
      {
        id: 1, node_sink_id: 2, node_src_id: 1, resource_uri: "/api/v1/edge/1/"
      }, {
        id: 2, node_sink_id: 3, node_src_id: 2, resource_uri: "/api/v1/edge/2/"
      }
    ]
  };

  var buildingsPayload = {
    meta: {
      limit: 5000, next: null, offset: 0, previous: null, total_count: 1
    }, 
    objects: [
      {
        centroid_id: 1, id: 1, name: "Ah.c", resource_uri: "/api/v1/building/1/"
      }
    ]
  };

  beforeEach(function() {
    this.addMatchers({
      toEqualData: function(expected) {
        return angular.equals(this.actual, expected);
      },

      isEmptyObject: function() {
        for (var key in this.actual) {
          return false;
        }
        return true;
      },

      toBeLength: function(length) {
        if (this.actual.length !== undefined) {
          return this.actual.length === length;
        }
        var count = 0;
        angular.forEach(this.actual, function(item) {
          count++;
        });
        return count === length;
      }
    });
  });

  beforeEach(module('mcServices'));

  describe('EditCtrl', function() {
    var scope, ctrl, $httpBackend;

    beforeEach(inject(function(_$httpBackend_, $rootScope, $controller) {
      $httpBackend = _$httpBackend_;
      $httpBackend.expectGET('/api/v1/node?format=json&limit=5000').respond(nodesPayload);
      $httpBackend.expectGET('/api/v1/edge?condensed=true&format=json&limit=5000').respond(edgesPayload);
      $httpBackend.expectGET('/api/v1/building?format=json&limit=5000').respond(buildingsPayload);

      scope = $rootScope.$new();
      ctrl = $controller(EditCtrl, {
        $scope: scope, 
        GoogleMapService: jasmine.createSpyObj(
          'GoogleMapService',
          ['addListener', 'addGlobalListener', 'drawPolyline', 'drawMarker', 'drawCircle']
        )
      });
    }));

    it('Verify points and edges are drawn.', function() {      
      scope.load();
      $httpBackend.flush();

      expect(scope.map.drawCircle).toHaveBeenCalled();
      expect(scope.map.drawPolyline).toHaveBeenCalled();
    });

    it('Moving a node should change its coordinates and redraw adjacent edges.', function() {
      ctrl.addNode(1, [150, 150]);
      ctrl.addNode(2, [200, 200]);
      var n1 = ctrl.nodes[1];
      var n2 = ctrl.nodes[2];

      ctrl.addEdge(1, n1, n2);
      var e1 = ctrl.edges[1];

      spyOn(e1, "redraw");
      ctrl.onNodeCenterChanged(n1, [50, 50]);

      expect(n1.coordinates).toEqualData([50, 50]);
      expect(e1.redraw).toHaveBeenCalled();
    });

    it("Reloads should delete added edges to existing nodes, but leave added nodes intact.", function() {
      scope.load(); $httpBackend.flush();

      ctrl.addNode(-1, [100, 100]);
      ctrl.addNode(-2, [200, 200]);
      var existing = ctrl.nodes[1];  
      var nn1 = ctrl.nodes[-1];
      var nn2 = ctrl.nodes[-2]; 

      // Should be deleted.
      ctrl.addEdge(-2, existing, nn2);

      // Should stay.
      ctrl.addEdge(-1, nn1, nn2);

      $httpBackend.expectGET('/api/v1/node?format=json&limit=5000').respond(nodesPayload);
      $httpBackend.expectGET('/api/v1/edge?condensed=true&format=json&limit=5000').respond(edgesPayload);
       $httpBackend.expectGET('/api/v1/building?format=json&limit=5000').respond(buildingsPayload);
      scope.load(); $httpBackend.flush();

      expect(ctrl.nodes).toBeLength(5);
      expect(ctrl.edges).toBeLength(3);
    });

    it('Verify statuses attached to added, changed, and deleted objects.', function() {
      ctrl.addNode(-1, [100, 100]);
      ctrl.addNode(1, [150, 150]);
      ctrl.addNode(2, [200, 200]);
      ctrl.addNode(3, [240, 240]);
      var nn1 = ctrl.nodes[-1];
      var n1 = ctrl.nodes[1];
      var n2 = ctrl.nodes[2];
      var n3 = ctrl.nodes[3];

      ctrl.onNodeCenterChanged(n1, [500, 500]);
      scope.deleteNode(n3);

      ctrl.addEdge(-1, n1, n2);
      var e1 = ctrl.edges[-1];

      expect(nn1.status).toEqual(STATUS.ADDED);
      expect(n1.status).toEqual(STATUS.CHANGED);
      expect(n2.status).toEqual(STATUS.UNCHANGED);
      expect(n3.status).toEqual(STATUS.DELETED);
      expect(e1.status).toEqual(STATUS.ADDED);
    });

    it('Deleting a newly added object should remove it completely.', function() {
      ctrl.addNode(-1, [100, 100]);
      var nn1 = ctrl.nodes[-1];

      scope.deleteNode(nn1);

      expect(ctrl.nodes).toBeLength(0);
    });

    xit('Added, changed, and deleted objects should revert to unchanged after a save.', function() {
      ctrl.addNode(-1, [100, 100]);
      ctrl.addNode(1, [150, 150]);
      ctrl.addNode(2, [200, 200]);
      ctrl.addNode(3, [240, 240]);
      var nn1 = ctrl.nodes[-1];
      var n1 = ctrl.nodes[1];
      var n2 = ctrl.nodes[2];
      var n3 = ctrl.nodes[3];

      ctrl.save();

      expect(nn1.status).toEqual(STATUS.UNCHANGED);
      expect(n1.status).toEqual(STATUS.UNCHANGED);
      expect(n2.status).toEqual(STATUS.UNCHANGED);
      expect(n3.status).toEqual(STATUS.UNCHANGED);
    });
  });
});
