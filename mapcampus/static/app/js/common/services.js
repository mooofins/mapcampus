'use strict';

var GoogleMapService = (function() {
  function GoogleMapService() {
    // The actual DOM object backing this service.
    this.el = new google.maps.Map(
      $("#map_canvas")[0], 
      {
        center: new google.maps.LatLng(40.10804, -88.22726),
        zoom: 18,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
      }
    );
  }

  GoogleMapService.prototype.subscribe = function(scope, prefix, object, view, events) {
    if (events) {
      angular.forEach(events, function(event) {
        google.maps.event.addListener(view, event, function(mapEvent) {
          if (event === 'click') {
            if (prefix === "map_") {
              var coordinates = [mapEvent.latLng.lat(), mapEvent.latLng.lng()];
              scope.$emit(prefix + event, object, coordinates);  
            } else {
              scope.$emit(prefix + event, object);
            }
          } else if (event === 'center_changed') {
            var coordinates = [view.getCenter().lat(), view.getCenter().lng()];
            scope.$emit(prefix + event, object, coordinates);
          } else {
            scope.$emit(prefix + event, object);
          }
        });
      });
    }
  }

  GoogleMapService.prototype.mapSubscribe = function($scope, events) {
    this.subscribe($scope, "map_", this, this.el, events);
  }

  GoogleMapService.prototype.erase = function(view) {
    if (view) {
      view.setMap(null);
    }
  }

  GoogleMapService.prototype.drawRoute = function(scope, route, events) {
    var arr = $.map(route.nodes, function(node) { 
      return new google.maps.LatLng(node.coordinates[0], node.coordinates[1]);
    });

    var line = new google.maps.Polyline({
      map: this.el,
      path: arr,
      strokeColor: "#FF0000",
      strokeOpacity: 0.8,
      strokeWeight: 5
    });

    var start = new google.maps.Marker({
      animation: google.maps.Animation.DROP,
      map: this.el,
      position: arr[0]
    });

    var end = new google.maps.Marker({
      animation: google.maps.Animation.DROP,
      map: this.el,
      position: arr[arr.length - 1]
    });  

    var bounds = new google.maps.LatLngBounds();
    angular.forEach(arr, function(ll) {
      bounds.extend(ll);
    });
    this.el.fitBounds(bounds);

    this.subscribe(scope, "route_", route, line, events);
    return [line, start, end];
  }

  GoogleMapService.prototype.drawNode = function(scope, node, events) {
    var opts = buildModelOptions(this, node);
    opts.center = new google.maps.LatLng(node.coordinates[0], node.coordinates[1]);
    opts.draggable = true;
    opts.radius = 2;
    opts.zIndex = 5;

    var circle = new google.maps.Circle(opts);

    this.subscribe(scope, "node_", node, circle, events);
    return circle;
  }

  GoogleMapService.prototype.redrawNode = function(node, selected) {
    if (node.view) {
      node.view.setOptions(buildModelOptions(this, node)); 
    }
  }

  GoogleMapService.prototype.drawEdge = function(scope, edge, events) {
    var arr = [
      new google.maps.LatLng(edge.src.coordinates[0], edge.src.coordinates[1]),
      new google.maps.LatLng(edge.sink.coordinates[0], edge.sink.coordinates[1])
    ];
    var opts = buildModelOptions(this, edge);
    opts.path = arr;
    opts.zIndex = 2;

    var line = new google.maps.Polyline(opts);

    this.subscribe(scope, "edge_", edge, line, events);
    return line;
  };

  GoogleMapService.prototype.redrawEdge = function(edge) {
    if (edge.view) {
      var arr = [
        new google.maps.LatLng(edge.src.coordinates[0], edge.src.coordinates[1]),
        new google.maps.LatLng(edge.sink.coordinates[0], edge.sink.coordinates[1])
      ];
      var opts = buildModelOptions(this, edge);
      opts.path = arr;

      edge.view.setOptions(opts);
    }
  }

  GoogleMapService.prototype.drawBuilding = function(scope, building, events) {
    var loc = new google.maps.LatLng(
      building.centroid.coordinates[0],
      building.centroid.coordinates[1]
    );

    var content = '<div class="icon-overlay top">' +
      '<div style="padding: 2px;">' +
        '<i class="icon-2x icon-building"></i>' +
      '</div>' +
    '</div>';

    var marker = new google.maps.Marker({
      map: this.el,
      position: loc,
      shadow: ""
    });

    this.subscribe(scope, "building_", building, marker, events);
    return marker;
  }

  GoogleMapService.prototype.redrawBuilding = function(building) {
    if (building.view) {
      var opts = { 
        position: new google.maps.LatLng(
          building.centroid.coordinates[0],
          building.centroid.coordinates[1]
        )
      };

      building.view.setOptions(opts);
    }
  }

  function buildModelOptions(map, model) {
    return {
      fillColor: computeColor(model),
      fillOpacity: 0.5,
      map: map.el,
      strokeColor: computeColor(model),
      strokeWeight: 3
    }
  }

  function computeColor(model) {
    if (model.selected) {
      return "#2f96b4";
    }
    switch (model.status) {
      case STATUS.UNCHANGED:
        return "#ee5f5b";
      case STATUS.CHANGED:
        return "#fcb44d"; 
      case STATUS.ADDED:
        return "#62c462";
    }
  }
  
  return GoogleMapService;
})();

angular.module('mcServices', ['ngResource'])
  .factory('Buildings', function($resource) {
    return $resource(
      '/api/v1/building/', 
      { format: 'json' }, 
      { query: { method: 'GET', isArray: true } }
    );
  })
  .factory('Nodes', function($resource) {
    return $resource(
      '/api/v1/node/', 
      { format: 'json' }, 
      { query: { method: 'GET', isArray: true } }
    );
  })
  .factory('Edges', function($resource) {
    return $resource(
      '/api/v1/edge/', 
      { format: 'json' }, 
      { query: { method: 'GET', isArray: true } }
    );
  })
  .factory('Routes', function($resource) {
    return $resource(
      '/api/v1/route/', 
      { format: 'json' }, 
      { query: { method: 'GET', isArray: true } }
    );
  })
  .factory('GoogleMapService', function() {
    return new GoogleMapService();
  });
