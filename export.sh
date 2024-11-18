#!/bin/bash

echo "/var/www/html/exports/claims.json"
yarn database:export > /var/www/html/exports/claims.json

echo "/var/www/html/exports/claims.nq"
node bin/jsonld2nquads.js /var/www/html/exports/claims.json > /var/www/html/exports/claims.nq