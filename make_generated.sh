#!/bin/bash

#for f in import/citation*.json; do
#    base=$(basename $f)
#    echo "${base}..."
#    ./bin/rdf_admin.js csl2rdf $f > import/generated/${base}.ttl
#done

for f in import/event*.json; do
    base=$(basename $f)
    fragment=$(echo $base | sed -e 's/.json//')
    if [[ "$base" =~ ^.*origin.*$ ]]; then
        : # skipped
    else
        echo "${base}..."
        ./bin/rdf_admin.js event2rdf --origin import/${fragment}-origin.json $f > import/generated/${base}.trig
    fi
done
