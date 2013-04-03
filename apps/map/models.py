from django.db import models
from django.contrib.gis.db import models as gismodels
from django.contrib import admin
from django.contrib.gis.geos import LineString

class Node(gismodels.Model):
  coordinates = gismodels.PointField()
  objects = gismodels.GeoManager()

class Building(gismodels.Model):
  name = models.CharField(max_length=100)
  centroid = gismodels.ForeignKey(Node, related_name='building_centroid')
  objects = gismodels.GeoManager()

class Edge(gismodels.Model):
  node_src = gismodels.ForeignKey(Node, related_name='edge_node_src')
  node_sink = gismodels.ForeignKey(Node, related_name='edge_node_sink')
  line = gismodels.LineStringField(); 
  objects = gismodels.GeoManager()

  def clean(self, *args, **kwargs):
    if self.node_src.id > self.node_sink.id:
      raise ValidationError('Node source id must be less than node sink id!')
    super(Edge, self).clean(*args, **kwargs)

  def full_clean(self, *args, **kwargs):
    return self.clean(*args, **kwargs)

  def save(self, *args, **kwargs):
    self.full_clean()
    super(Edge, self).save(*args, **kwargs)