#!/bin/bash

echo "[processing : csl2rdf import/citation*.json]"
for f in import/citation*.json; do
    base=$(basename $f)
    echo "${base}..."
    ./bin/rdf_admin.js csl2rdf $f > import/generated/${base}.ttl
done

echo "[processing : event2rdf import/event*.json]"
for f in import/event*.json; do
    base=$(basename $f)
    fragment=$(echo $base | sed -e 's/.json//')
    if [[ "$base" =~ ^.*origin.*$ ]]; then
        : # skipped
    else
        echo "${base}..."
        ./bin/rdf_admin.js event2rdf \
            --format 'application/ld+json' \
            --frame config/claim.jsonld \
            --origin import/${fragment}-origin.json $f > import/generated/${fragment}.jsonld
        jq '{original: .id , updated: .published}' import/${fragment}-origin.json > import/generated/${fragment}.jsonld.meta
    fi
done
