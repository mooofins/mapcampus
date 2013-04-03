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
  $scope.map.mapSubscribe($scope, ['click']);
  $scope.$on('map_click', function(event, map, coordinates) {
    switch ($scope.state) {
      case $scope.STATE.ADD_NODE:
        me.addNode(addedNodeSeq--, coordinates);
        break;
    }
  });

  // Bind model listeners. Most of the $scope.STATE machine logic should go here.
  $scope.$on('node_click', function(event, node) {
    switch ($scope.state) {
      case $scope.STATE.EDIT:
        select(node);
        break;
      case $scope.STATE.ADD_EDGE_START:
        edgeSrc = node;
        $scope.state = $scope.STATE.ADD_EDGE_END;
        break;
      case $scope.STATE.ADD_EDGE_END:
        me.addEdge(addedEdgeSeq--, edgeSrc, node);
        $scope.state = $scope.STATE.ADD_EDGE_START;
        break;
      case $scope.STATE.ADD_BUILDING:
        me.addBuilding(addedBuildingSeq--, "", node);
        break;
    }
  });

  $scope.$on('node_center_changed', function(event, node, coordinates) {
    node.move(coordinates); 
  });

  $scope.$on('edge_click', function(event, edge) {
    switch ($scope.state) {
      case $scope.STATE.EDIT:
        select(edge);
        break;
    }
  });

  $scope.$on('building_click', function(event, building) {
    switch ($scope.state) {
      case $scope.STATE.EDIT:
        select(building);
        break;
    }
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

  $scope.getEditorPath = function(model) {
    if (!model) {
      return "";
    }
    return '/static/app/html/' + model.type() + '_edit.html';
  }

  $scope.deleteNode = function(node) {
    if (node.status === STATUS.ADDED) {
      delete me.nodes[node.id];
      
      // All edges adjacent to a new node are new as well. 
      angular.forEach(node.adjacent, function(edge) {
        delete me.edges[edge.id];
      });

      if (node.building) {
        delete me.buildings[node.building.id];
      }
    }

    if (node.building) {
      $scope.deleteBuilding(node.building);
    }

    erase(node);
  }

  $scope.deleteEdge = function(edge) {
    if (edge.status === STATUS.ADDED) {
      delete me.edges[edge.id];
    }
    erase(edge);
  }

  $scope.deleteBuilding = function(building) {
    if (building.status === STATUS.ADDED) {
      delete me.buildings[building.id];
    }
    erase(building);
  }

  this.addNode = function(id, coordinates) {
    var node = new Node($scope.map, id, coordinates);
    node.draw($scope, ['click', 'center_changed']);
    me.nodes[id] = node;
  }

  this.addEdge = function(id, src, sink) {
    var edge = new Edge($scope.map, id, src, sink);
    edge.draw($scope, ['click']);
    me.edges[id] = edge;
  }

  this.addBuilding = function(id, name, centroid) {
    var building = new Building($scope.map, id, name, centroid);
    building.draw($scope, ['click']);
    me.buildings[id] = building;
  }

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

  function erase(model) {
    if ($scope.data.selected === model) {
      $scope.data.selected = null;
    }
    model.erase();
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