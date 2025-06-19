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

echo "[processing : event2rdf dev/event*.json]"
for f in dev/event*.json; do
    base=$(basename $f)
    fragment=$(echo $base | sed -e 's/.json//')
    if [[ "$base" =~ ^.*origin.*$ ]]; then
        : # skipped
    else
        echo "${base}..."
        ./bin/rdf_admin.js event2rdf \
            --format 'application/ld+json' \
            --frame config/claim.jsonld \
            --origin dev/${fragment}-origin.json $f > dev/generated/${fragment}.jsonld
        jq '{original: .id , updated: .published}' dev/${fragment}-origin.json > dev/generated/${fragment}.jsonld.meta
    fi
done
