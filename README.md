# RDF Generator

A script to generate RDF data from [CSL](https://docs.citationstyles.org/en/stable/specification.html#csl-1-0-2-specification) (Citation Style Language) data or [Event Notifications](https://www.eventnotifications.net) that point to CSL data. 

## Install

```
yarn install
```

```
yarn run download:rmlmapper
```

```
cp .env-example .env
```

## Demo

```
./bin/rdf_admin.js csl2rdf import/citation1.json
```

```
./bin/rdf_admin.js event2rdf import/event1.json
```

## Config

The [RML](https://rml.io) mapping file used for CSL to RDF mapping can be found in `./mapping.ttl`.