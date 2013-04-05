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

  GoogleMapService.prototype.addListener = function(model, event, callback) {
    google.maps.event.addListener(model.view, event, callback);
  }

  GoogleMapService.prototype.addGlobalListener = function(event, callback) {
    google.maps.event.addListener(this.el, event, callback);
  }

  GoogleMapService.prototype.convertToLatLng = function(coordinates) {
    return new google.maps.LatLng(coordinates[0], coordinates[1]);
  }

  GoogleMapService.prototype.drawCircle = function(coordinates, opts) {
    var opts = opts || {};
    opts.center = new google.maps.LatLng(coordinates[0], coordinates[1]);
    opts.map = this.el;

    var circle = new google.maps.Circle(opts);
    return circle;
  }

  GoogleMapService.prototype.drawPolyline = function(arr, opts) {
    var opts = opts || {};
    opts.path = $.map(arr, function(coordinates) { 
      return new google.maps.LatLng(coordinates[0], coordinates[1]);
    });
    opts.map = this.el;

    var line = new google.maps.Polyline(opts);
    return line;
  }

  GoogleMapService.prototype.drawMarker = function(coordinates, opts) {
    var opts = opts || {};
    opts.position = new google.maps.LatLng(coordinates[0], coordinates[1]);
    opts.map = this.el;

    var marker = new google.maps.Marker(opts);
    return marker;
  }

  GoogleMapService.prototype.fitBoundsToPolyline = function(line) {
    var path = line.getPath();
    var bounds = new google.maps.LatLngBounds();
    angular.forEach(path, function(ll) {
      bounds.extend(ll);
    });
    this.el.fitBounds(bounds);
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
