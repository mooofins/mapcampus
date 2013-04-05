'use strict';

var models = models || {};

var STATUS = {
  UNCHANGED: 0,
  CHANGED: 1,
  ADDED: 2,
  DELETED: 3,
};

function computeColor(status, selected) {
  if (selected) {
    return "#2f96b4";
  }
  switch (status) {
    case STATUS.UNCHANGED:
      return "#ee5f5b";
    case STATUS.CHANGED:
      return "#fcb44d"; 
    case STATUS.ADDED:
      return "#62c462";
  }
}

var Route = (function() {
  function Route(map, nodes) {
    this.map = map;
    this.nodes = nodes;
  }

  Route.prototype.draw = function() {
    var arr = $.map(this.nodes, function(node, i) { 
      return [node.coordinates];
    });

    var pathOpts = {
      fillColor: computeColor(STATUS.UNCHANGED, false),
      fillOpacity: 0.5,
      strokeColor: computeColor(STATUS.UNCHANGED, false),
      strokeWeight: 3,
      zIndex: 2,
    };

    this.start = this.map.drawMarker(arr[0]);
    this.path = this.map.drawPolyline(arr, pathOpts);
    this.end = this.map.drawMarker(arr[arr.length - 1]);

    this.map.fitBoundsToPolyline(this.path);
  }

  Route.prototype.erase = function() {
    if (this.start) {
      this.start.setMap(null);
    }
    if (this.path) {
      this.path.setMap(null);
    }
    if (this.end) {
      this.end.setMap(null);
    }
  }

  return Route;
})();

var Node = (function() {
  function Node(map, id, coordinates) {
    this.map = map;

    this.status = id >= 0 ? STATUS.UNCHANGED : STATUS.ADDED;
    this.selected = false;

    this.id = id;
    this.coordinates = coordinates;
    this.door = false;
    this.wheelchair = false;

    this.adjacent = [];
    this.building = null;
  }

  Node.prototype.draw = function() {
    var opts = {
      draggable: true,
      fillColor: computeColor(this.status, this.selected),
      fillOpacity: 0.5,
      radius: 2,
      strokeColor: computeColor(this.status, this.selected),
      strokeWeight: 3,
      zIndex: 5,
    };
    this.view = this.map.drawCircle(this.coordinates, opts);
  }

  Node.prototype.redraw = function() {
    if (this.view) {
      this.view.setOptions({
        fillColor: computeColor(this.status, this.selected),
        strokeColor: computeColor(this.status, this.selected),
      });
    }
  }

  Node.prototype.erase = function() {
    this.status = STATUS.DELETED;
    if (this.view) {
      this.view.setMap(null);

      angular.forEach(this.adjacent, function(edge) {
        edge.erase();
      });
      
      if (this.building) {
        this.building.erase();
      }
    }
  }

  Node.prototype.type = function() {
    return 'node';
  }

  return Node;
})();

var Edge = (function() {
  function Edge(map, id, src, sink) {
    this.map = map;

    this.status = id >= 0 ? STATUS.UNCHANGED : STATUS.ADDED;
    this.selected = false;

    this.id = id;
    this.src = src;
    this.sink = sink;

    src.adjacent.push(this);
    sink.adjacent.push(this);
  }

  Edge.prototype.draw = function() {
    var arr = [this.src.coordinates, this.sink.coordinates];
    var opts = {
      fillColor: computeColor(this.status, this.selected),
      fillOpacity: 0.5,
      strokeColor: computeColor(this.status, this.selected),
      strokeWeight: 3,
      zIndex: 2,
    };
    this.view = this.map.drawPolyline(arr, opts);
  }

  Edge.prototype.redraw = function() {
    if (this.view) {
      var path = [
        this.map.convertToLatLng(this.src.coordinates),
        this.map.convertToLatLng(this.sink.coordinates)
      ];
      this.view.setOptions({
        path: path,
        fillColor: computeColor(this.status, this.selected),
        strokeColor: computeColor(this.status, this.selected),
      });
    }
  }

  Edge.prototype.erase = function() {
    this.status = STATUS.DELETED;
    if (this.view) {
      this.view.setMap(null);
    }
  }

  Edge.prototype.type = function() {
    return 'edge';
  }

  return Edge;
})();

var Building = (function() {
  function Building(map, id, name, centroid) {
    this.map = map;

    this.status = id >= 0 ? STATUS.UNCHANGED : STATUS.ADDED;
    this.selected = false;

    this.id = id;
    this.name = name;
    this.centroid = centroid;

    centroid.building = this;
  }

  Building.prototype.draw = function() {
    this.view = this.map.drawMarker(this.centroid.coordinates);
  }

  Building.prototype.redraw = function() {
    if (this.view) {
      this.view.setOptions({
        position: this.map.convertToLatLng(this.centroid.coordinates)
      });
    }
  }

  Building.prototype.erase = function() {
    this.status = STATUS.DELETED;
    if (this.view) {
      this.view.setMap(null);
    }
  }

  Building.prototype.type = function() {
    return 'building';
  }

  return Building;
})();
