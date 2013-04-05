'use strict';

function EditCtrl($scope, $compile, $q, Nodes, Edges, Buildings, GoogleMapService) {
  $scope.STATE = {
    EDIT: 0,
    ADD_NODE: 1,
    ADD_EDGE_START: 2,
    ADD_EDGE_END: 3,
    ADD_BUILDING: 4,
  };

  // Scope variables
  $scope.state = $scope.STATE.EDIT;
  $scope.map = GoogleMapService;
  $scope.data = { selected: null };

  // Controller variables
  this.nodes = {};
  this.edges = {};
  this.buildings = {};

  // Private variables
  var addedNodeSeq = -1;
  var addedEdgeSeq = -1;
  var addedBuildingSeq = -1;

  var edgeSrc = null;

  // Caching a reference to this to avoid scoping issues.
  var me = this;

  // Bind map listener.
  $scope.map.addGlobalListener('click', function(event) {
    var coordinates = [event.latLng.lat(), event.latLng.lng()];
    switch ($scope.state) {
      case $scope.STATE.ADD_NODE:
        var id = addedNodeSeq; addedNodeSeq--;

        me.addNode(id, coordinates);
        select(me.nodes[id]);
        $scope.state = $scope.STATE.EDIT;
        break;
    }
    $scope.$apply();
  });

  $scope.save = function() {
    var objects = [];
    var deletedObjects = [];
    angular.forEach(me.nodes, function(node, key) {
      if (node.status === CHANGED || node.status === ADDED) {
        objects.push(node);
      } else if (node.status === DELETED) {
        deletedObjects.push(node);
      }
    });
    angular.forEach(me.edges, function(edge, key) {
      if (edge.status === CHANGED || edge.status === ADDED) {
        objects.push(edge);
      } else if (edge.status === DELETED) {
        deletedObjects.push(edge);
      }
    });
  };

  $scope.load = function($timeout) {
    // Delete all persisted features.
    angular.forEach(me.nodes, function(node, key) {
      if (node.status !== STATUS.ADDED) {
        delete me.nodes[node.id];
        
        angular.forEach(node.adjacent, function(edge) {
          delete me.edges[edge.id];
        });

        if (node.building) {
          delete me.buildings[node.building.id];
        }

        node.erase();
      }
    });

    $scope.loading = true;

    var protoEdges = [];
    var protoBuildings = [];

    var promises = [
      createNodesPromise(), 
      createProtoEdgesPromise(protoEdges),
      createProtoBuildingsPromise(protoBuildings)
    ];
    $q.all(promises).then(function() {
      // Create edges from proto-edge objects.
      angular.forEach(protoEdges, function(obj) {
        var src = me.nodes[obj.node_src_id];
        var sink = me.nodes[obj.node_sink_id];
        me.addEdge(obj.id, src, sink);
      });

      angular.forEach(protoBuildings, function(obj) {
        var centroid = me.nodes[obj.centroid_id];
        me.addBuilding(obj.id, obj.name, centroid);
      });

      $scope.loading = false;
    });
  };

  function createNodesPromise() {
    var deferred = $q.defer();
    Nodes.get({ limit: 5000 }, function(data) {
      data.objects.forEach(function(obj) {
        var coords = obj.coordinates.coordinates;
        me.addNode(obj.id, [coords[1], coords[0]]);
      });
      deferred.resolve();
    });
    return deferred.promise;
  }

  function createProtoEdgesPromise(protoEdges) {
    var deferred = $q.defer();
    Edges.get({ limit: 5000, condensed: true }, function(data) {
      data.objects.forEach(function(obj) {
        protoEdges.push(obj);
      });
      deferred.resolve();
    });
    return deferred.promise;
  }

  function createProtoBuildingsPromise(protoBuildings) {
    var deferred = $q.defer();
    Buildings.get({ limit: 5000 }, function(data) {
      data.objects.forEach(function(obj) {
        protoBuildings.push(obj);
      });
      deferred.resolve();
    });
    return deferred.promise;
  }

  $scope.getEditorPath = function(model) {
    if (!model) {
      return "";
    }
    return '/static/app/html/' + model.type() + '_edit.html';
  }

  $scope.unselect = function() {
    $scope.data.selected = null;
  }

  $scope.deleteNode = function(node) {
    if (node.status === STATUS.ADDED) {
      delete me.nodes[node.id];
    }

    angular.forEach(node.adjacent, function(edge) {
      $scope.deleteEdge(edge);
    });

    if (node.building) {
      $scope.deleteBuilding(node.building);
    }

    node.erase();
  }

  $scope.deleteEdge = function(edge) {
    if (edge.status === STATUS.ADDED) {
      delete me.edges[edge.id];
    }
    edge.erase();
  }

  $scope.deleteBuilding = function(building) {
    if (building.status === STATUS.ADDED) {
      delete me.buildings[building.id];
    }
    building.erase();
  }

  this.addNode = function(id, coordinates) {
    var node = new Node($scope.map, id, coordinates);
    node.draw();
    $scope.map.addListener(node, 'click', function() {
      onNodeClick(node); 
    });
    $scope.map.addListener(node, 'center_changed', function(event) {
      var coordinates = [
        node.view.getCenter().lat(),
        node.view.getCenter().lng(),
      ]
      onNodeCenterChanged(node, coordinates); 
    });
    me.nodes[id] = node;
  }

  this.addEdge = function(id, src, sink) {
    var edge = new Edge($scope.map, id, src, sink);
    edge.draw();
    $scope.map.addListener(edge, 'click', function() {
      onEdgeClick(edge); 
    });
    me.edges[id] = edge;
  }

  this.addBuilding = function(id, name, centroid) {
    var building = new Building($scope.map, id, name, centroid);
    building.draw();
    $scope.map.addListener(building, 'click', function() {
      onBuildingClick(building); 
    });
    me.buildings[id] = building;
  }

  this.onNodeClick = function(node) {
    switch ($scope.state) {
      case $scope.STATE.EDIT:
        select(node);
        break;
      case $scope.STATE.ADD_EDGE_START:
        edgeSrc = node;
        $scope.state = $scope.STATE.ADD_EDGE_END;
        break;
      case $scope.STATE.ADD_EDGE_END:
        var id = addedEdgeSeq; addedEdgeSeq--;
        me.addEdge(id, edgeSrc, node);
        select(me.edges[id]);
        $scope.state = $scope.STATE.EDIT;
        break;
      case $scope.STATE.ADD_BUILDING:
        var id = addedBuildingSeq; addedBuildingSeq--;
        me.addBuilding(id, "", node);
        select(me.buildings[id]);
        $scope.state = $scope.STATE.EDIT;
        break;
    }
  }

  this.onNodeCenterChanged = function(node, coordinates) {
    if (node.status === STATUS.UNCHANGED) {
      node.status = STATUS.CHANGED;
    }
    node.coordinates = coordinates;

    node.redraw();
    angular.forEach(node.adjacent, function(edge) {
      if (edge.status === STATUS.UNCHANGED) {
        edge.status = STATUS.CHANGED;
      }
      edge.redraw();
    });
    if (node.building) {
      node.building.redraw();
    }
  }

  this.onEdgeClick = function(edge) {
    switch ($scope.state) {
      case $scope.STATE.EDIT:
        select(edge);
        break;
    }
  }

  this.onBuildingClick = function(building) {
    switch ($scope.state) {
      case $scope.STATE.EDIT:
        select(building);
        break;
    }
  }

  function select(model) {
    var old = $scope.data.selected;
    if (old != model) {
      if (old) {
        old.selected = false;
        old.redraw();
      }
      $scope.data.selected = model;
      model.selected = true;
      model.redraw();
    }
    $scope.$apply();
  }
}