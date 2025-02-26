#!/bin/sh

./bin/rdf_admin.js import > /dev/null
npx event_admin export --intention rdf