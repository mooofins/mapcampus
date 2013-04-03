import networkx as nx

from tastypie import fields
from tastypie.cache import SimpleCache
from tastypie.resources import Resource
from tastypie.contrib.gis.resources import ModelResource

from apps.map.graph import LazyGraph
from apps.map.models import Building, Node, Edge

class DummyPaginator(object):
  def __init__(self, objects, collection_name='objects', **kwargs):
    self.objects = objects
    self.collection_name = collection_name

  def page(self):
    return {
      self.collection_name: self.objects,
    }

class BuildingResource(ModelResource):
  class Meta:
    queryset = Building.objects.all()
    resource_name = 'building'
    max_limit = 10000

  def dehydrate(self, bundle): 
    bundle = super(BuildingResource, self).dehydrate(bundle) 
    bundle.data['centroid_id'] = bundle.obj.centroid_id
    return bundle 

class NodeResource(ModelResource):
  class Meta:
    queryset = Node.objects.all()
    resource_name = 'node'
    #cache = SimpleCache(timeout=10)
    max_limit = 10000

class EdgeResource(ModelResource):
  class Meta:
    queryset = Edge.objects.all()
    resource_name = 'edge'
    #cache = SimpleCache(timeout=10)
    max_limit = 10000

  def dehydrate(self, bundle): 
    bundle = super(EdgeResource, self).dehydrate(bundle) 

     # exclude line field if GET parameter set
    if bundle.request.GET.get('condensed', 'false') == 'true': 
      del bundle.data['line'] 
      bundle.data['node_src_id'] = bundle.obj.node_src_id
      bundle.data['node_sink_id'] = bundle.obj.node_sink_id

    return bundle 

class RouteResource(ModelResource):
  class Meta:
    resource_name = 'route'
    allowed_methods = ['get']
    object_class = Node
    #authentication = DjangoAuthentication()
    #filtering = { "pk": ['in', 'exact'], }

  def obj_get_list(self, bundle, **kwargs):
    from_id = int(bundle.request.GET.get('from_id', -1))
    to_id = int(bundle.request.GET.get('to_id', -1))

    if from_id != -1 and to_id != -1:
      from_building = Building.objects.get(id=from_id)
      to_building = Building.objects.get(id=to_id)

      node_from_id = from_building.centroid_id
      node_to_id = to_building.centroid_id

      lz = LazyGraph()
      length, path = nx.bidirectional_dijkstra(lz.get_graph(), node_from_id, node_to_id, weight='weight')

      return [Node.objects.get(id=x) for x in path]

    return []

  def _build_reverse_url(self, name, args=None, kwargs=None):
    kwargs['resource_name'] = 'node'
    return super(RouteResource, self)._build_reverse_url(name, args=args, kwargs=kwargs)
