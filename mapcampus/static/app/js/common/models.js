'use strict';

var STATUS = {
  UNCHANGED: 0,
  CHANGED: 1,
  ADDED: 2,
  DELETED: 3,
};

var Route = (function() {
  function Route(map, nodes) {
    this.map = map;
    this.nodes = nodes;
  }

  Route.prototype.draw = function(scope, events) {
    this.views = this.map.drawRoute(scope, this, events);
  }

  Route.prototype.erase = function() {
    angular.forEach(this.views, function(view) {
      view.setMap(null);
    });
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

  Node.prototype.draw = function(scope, events) {
    this.view = this.map.drawNode(scope, this, events);
  }

  Node.prototype.redraw = function() {
    this.map.redrawNode(this);
  }

  Node.prototype.erase = function() {
    this.status = STATUS.DELETED;
    this.map.erase(this.view);
    angular.forEach(this.adjacent, function(edge) {
      edge.erase();
    });
    if (this.building) {
      this.building.erase();
    }
  }

  Node.prototype.move = function(coordinates) {
    if (this.status === STATUS.UNCHANGED) {
      this.status = STATUS.CHANGED;
    }

    this.coordinates = coordinates;
    this.redraw();
    angular.forEach(this.adjacent, function(edge) {
      edge.redraw();
    });
    if (this.building) {
      this.building.redraw();
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

  Edge.prototype.draw = function(scope, events) {
    this.view = this.map.drawEdge(scope, this, events);
  }

  Edge.prototype.redraw = function() {
    this.map.redrawEdge(this);
  }

  Edge.prototype.erase = function() {
    this.status = STATUS.DELETED;
    this.map.erase(this.view);
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

  Building.prototype.draw = function(scope, events) {
    this.view = this.map.drawBuilding(scope, this, events);
  }

  Building.prototype.redraw = function() {
    this.map.redrawBuilding(this);
  }

  Building.prototype.erase = function() {
    this.status = STATUS.DELETED;
    this.map.erase(this.view);
  }

  Building.prototype.type = function() {
    return 'building';
  }

  return Building;
})();