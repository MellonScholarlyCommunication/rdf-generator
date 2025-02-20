# RDF Generator

A script to generate RDF data from [CSL](https://docs.citationstyles.org/en/stable/specification.html#csl-1-0-2-specification) (Citation Style Language) data or [Event Notifications](https://www.eventnotifications.net) that point to CSL data. 

For the mapping we use RDF Mapping Language from [RML.io](https://rml.io).

## Install

```
yarn install
yarn run download:rmlmapper
npm link eventlog-server
```

## Configuration

```
cp .env-example .env
```

## Demo

```
./bin/rdf_admin.js csl2rdf import/citation1.json
<https://www.dlib.org/dlib/april99/van_de_sompel/04van_de_sompel-pt2.html> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/net/xbiblio/csl#webpage> .
<https://www.dlib.org/dlib/april99/van_de_sompel/04van_de_sompel-pt2.html> <https://schema.org/title> "Reference Linking in a Hybrid Library Enivonment Part 2: SFX, a Generic Linking Solution" .
```

```
./bin/rdf_admin.js event2rdf --origin=import/event1-origin.json import/event1.json
<urn:uuid:afe62248-623d-4a2a-91b9-cd655869ff41> {
<https://scipost.org/submissions/scipost_202408_00008v1/> a <http://purl.org/net/xbiblio/csl#article-journal>;
    <https://schema.org/abstract> "SciPost Submission Detail Adiabatic gauge potential and integrability breaking with free fermions";
    <https://schema.org/author> <urn:uuid:07e72ccb-cd6a-45a5-a53f-e1faf6a0c7a5>, <urn:uuid:580ddc20-cf19-43c8-91e0-6b01fbb6f148>, <urn:uuid:add90282-bd29-421c-8381-aae58e10e611>, <urn:uuid:e420671d-de38-4dbe-b0e9-5a7198154390>;
    <https://schema.org/datePublished> "2024";
    <https://schema.org/language> "en";
    <https://schema.org/title> "Adiabatic gauge potential and integrability breaking with free fermions".
<urn:uuid:07e72ccb-cd6a-45a5-a53f-e1faf6a0c7a5> a <https://schema.org/Person>;
    <https://schema.org/familyName> "Pozsgay";
    <https://schema.org/givenName> "Balázs".
<urn:uuid:580ddc20-cf19-43c8-91e0-6b01fbb6f148> a <https://schema.org/Person>;
    <https://schema.org/familyName> "Vona";
    <https://schema.org/givenName> "István".
<urn:uuid:add90282-bd29-421c-8381-aae58e10e611> a <https://schema.org/Person>;
    <https://schema.org/familyName> "Tiutiakina";
    <https://schema.org/givenName> "Anastasiia".
<urn:uuid:e420671d-de38-4dbe-b0e9-5a7198154390> a <https://schema.org/Person>;
    <https://schema.org/familyName> "Sharipov";
    <https://schema.org/givenName> "Rustem"
}
<urn:uuid:4e1e5edf-25b3-4bb9-9187-b76159e84d60> a <https://schema.org/Claim>;
    <https://schema.org/about> <urn:uuid:afe62248-623d-4a2a-91b9-cd655869ff41>;
    <https://schema.org/creator> <https://mastodon.social/@patrickhochstenbach>.
<https://mastodon.social/@patrickhochstenbach> a <https://schema.org/Person>;
    <https://schema.org/name> "patrickhochstenbach".
<urn:uuid:4e1e5edf-25b3-4bb9-9187-b76159e84d60> <https://schema.org/sdPublisher> <https://mycontributions.info/service/m/profile/card#me>;
    <https://schema.org/sdDatePublished> "2024-09-30T10:51:41.000Z";
    <https://schema.org/mainEntity> <https://scipost.org/submissions/scipost_202408_00008v1/>.
```

## JSON-LD serialization

```(json)
{
  "@context": "https://mycontributions.info/contexts/claim.jsonld",
  "id": "urn:uuid:4e1e5edf-25b3-4bb9-9187-b76159e84d60",
  "type": "Claim",
  "schema:about": {
    "id": "urn:uuid:afe62248-623d-4a2a-91b9-cd655869ff41"
  },
  "creator": {
    "id": "https://mastodon.social/@patrickhochstenbach",
    "type": "Person",
    "name": "patrickhochstenbach"
  },
  "mainEntity": {
    "id": "https://scipost.org/submissions/scipost_202408_00008v1/",
    "type": "http://purl.org/net/xbiblio/csl#article-journal",
    "abstract": "SciPost Submission Detail Adiabatic gauge potential and integrability breaking with free fermions",
    "author": [
      {
        "id": "urn:uuid:07e72ccb-cd6a-45a5-a53f-e1faf6a0c7a5",
        "type": "Person",
        "familyName": "Pozsgay",
        "givenName": "Balázs"
      },
      {
        "id": "urn:uuid:580ddc20-cf19-43c8-91e0-6b01fbb6f148",
        "type": "Person",
        "familyName": "Vona",
        "givenName": "István"
      },
      {
        "id": "urn:uuid:add90282-bd29-421c-8381-aae58e10e611",
        "type": "Person",
        "familyName": "Tiutiakina",
        "givenName": "Anastasiia"
      },
      {
        "id": "urn:uuid:e420671d-de38-4dbe-b0e9-5a7198154390",
        "type": "Person",
        "familyName": "Sharipov",
        "givenName": "Rustem"
      }
    ],
    "datePublished": "2024",
    "language": "en",
    "title": "Adiabatic gauge potential and integrability breaking with free fermions"
  },
  "sdDatePublished": "2024-09-30T10:51:41.000Z",
  "sdPublisher": {
    "id": "https://mycontributions.info/service/m/profile/card#me"
  }
}
```

## Create a claim database

Create the database:

```
yarn -s database:init
```

Import data from the cache database:

```
yarn database:import
```

Export all claims as JSONLD

```
yarn database:export
```

## Remove all data 

```
yarn real-clean
```

## Generate demonstration data

The `make_generated.sh` creates Turtle from CSL files `import/citation*.json` and JSON-LD from `import/event*.json` files. The output is stored in `import/generated`.

```
./make_generated.sh
```

## Export the claims database to a public web address

Make the claims database available as a JSONL and NQuads dump at http://localhost/exports/.

```
./export.sh
```

## Config

The [RML](https://rml.io) mapping file used for CSL to RDF mapping can be found in `./config/mapping.ttl`.

The JSON-LD frame for the claims can be found in `./config/claim.jsonld` and is published online as https://mycontributions.info/contexts/claim.jsonld

- `CACHE_NAME` : the name of the main event notification cache table
- `POSTGRES_*` : database connection parameters
- `RMLMAPPER` : the path to the RML mapper JAR file
- `RMLMAP` : the RML map to used to generate RDF from CSL
- `TEMPDIR` : a temporary process directory
- `CONTEXT_URL` : the URL of the published JSON-LD frame for claims
