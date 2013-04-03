import networkx as nx
from django.db import connection, transaction
from django.contrib.gis.geos import WKBReader

from models import Edge, Node

class LazyGraph(object):
  _graph = None

  def get_graph(self):
    if not LazyGraph._graph:
      LazyGraph._graph = nx.Graph()
      self.reload()
        
    return LazyGraph._graph

  def reload(self):
    LazyGraph._graph.clear()

    wkb = WKBReader()
    cursor = connection.cursor()
    cursor.execute("SELECT id, node_src_id, node_sink_id, line FROM map_edge")
    for row in cursor.fetchall():
      line = wkb.read(row[3])
      LazyGraph._graph.add_edge(
        row[1], 
        row[2], 
        { 'weight': line.length }
      )
      LazyGraph._graph.add_edge(
        row[2], 
        row[1], 
        { 'weight': line.length }
      )