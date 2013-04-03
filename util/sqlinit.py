#!/usr/bin/env python
import sys
import os
import traceback
import argparse

os.environ['DJANGO_SETTINGS_MODULE'] = "mapcampus.settings"

from django.db import connection, transaction

def main():
  cursor = connection.cursor()
  cursor.execute("ALTER TABLE map_edge ADD CONSTRAINT node_order_check CHECK (node_src_id < node_sink_id);")
  return 0

if __name__ == '__main__':
  try:
    parser = argparse.ArgumentParser()
    global_args = parser.parse_args()
    sys.exit(main())
  except KeyboardInterrupt, e: # Ctrl-C
    raise e
  except SystemExit, e: # sys.exit()
    raise e
  except Exception, e:
    print str(e)
    traceback.print_exc()
    exit(1)
