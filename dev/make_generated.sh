#!/bin/bash
#
# Dev script to generated Claims RDF from CSL (citation*) and EN (event*) files.
# This can be used to tune the RML mapping config/mapping.ttl
#
if [ ! -d dev/generated ]; then
    mkdir -p dev/generated
fi

echo "[processing : csl2rdf dev/citation*.json]"
for f in dev/citation*.json; do
    base=$(basename $f)
    echo "${base}..."
    ./bin/rdf_admin.js csl2rdf $f > dev/generated/${base}.ttl
done