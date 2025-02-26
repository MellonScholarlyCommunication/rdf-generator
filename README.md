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
<https://www.dlib.org/dlib/april99/van_de_sompel/04van_de_sompel-pt2.html> <https://schema.org/title> "Reference Linking in a Hybrid Library Enivronment Part 2: SFX, a Generic Linking Solution" .
```

```
./bin/rdf_admin.js event2rdf --origin=import/event1-origin.json import/event1.json
<urn:uuid:c2006a89-8d73-47d6-a165-6c82e1939f35> {
<https://www.dlib.org/dlib/april99/van_de_sompel/04van_de_sompel-pt2.html> a <http://purl.org/net/xbiblio/csl#webpage>;
    <https://schema.org/title> "Reference Linking in a Hybrid Library Enivonment Part 2: SFX, a Generic Linking Solution"
}
<urn:uuid:ad3838e2-252b-4db2-b31d-caeedbb87313> a <https://schema.org/Claim>;
    <https://schema.org/about> <urn:uuid:c2006a89-8d73-47d6-a165-6c82e1939f35>;
    <https://schema.org/creator> 
      <https://mastodon.social/@patrickhochstenbach>.
<https://mastodon.social/@patrickhochstenbach> 
    a <https://schema.org/Person>;
    <https://schema.org/name> "patrickhochstenbach";
    <https://mycontributions.info/ns#claimProfile> 
      <https://wiki.mycontributions.info/en/researcher/orcid/0000-0001-8390-6171>;
    <https://mycontributions.info/ns#verificationProfile> 
      <https://mycontributions.info/profiles/9010.html>.
<urn:uuid:ad3838e2-252b-4db2-b31d-caeedbb87313> 
    <https://schema.org/sdPublisher> 
      <https://mycontributions.info/service/m/profile/card#me>.
<https://mycontributions.info/service/m/profile/card#me> 
    a <https://schema.org/Service>;
    <https://schema.org/name> "Mastodon Bot".
<urn:uuid:ad3838e2-252b-4db2-b31d-caeedbb87313> 
    <https://schema.org/sdDatePublished> 
      "2025-02-26T07:40:07.328Z";
    <https://schema.org/isBasedOn> 
      <https://mastodon.social/@patrickhochstenbach/114069052052314604>;
    <https://schema.org/mainEntity> 
      <https://www.dlib.org/dlib/april99/van_de_sompel/04van_de_sompel-pt2.html>.
```

## JSON-LD serialization

```(json)
{
  "@context": "https://mycontributions.info/contexts/claim.jsonld",
  "id": "urn:uuid:ad3838e2-252b-4db2-b31d-caeedbb87313",
  "type": "Claim",
  "schema:about": {
    "id": "urn:uuid:c2006a89-8d73-47d6-a165-6c82e1939f35"
  },
  "creator": {
    "id": "https://mastodon.social/@patrickhochstenbach",
    "type": "Person",
    "claimProfile": "https://wiki.mycontributions.info/en/researcher/orcid/0000-0001-8390-6171",
    "verificationProfile": "https://mycontributions.info/profiles/9010.html",
    "name": "patrickhochstenbach"
  },
  "isBasedOn": "https://mastodon.social/@patrickhochstenbach/114069052052314604",
  "mainEntity": {
    "id": "https://www.dlib.org/dlib/april99/van_de_sompel/04van_de_sompel-pt2.html",
    "type": "http://purl.org/net/xbiblio/csl#webpage",
    "title": "Reference Linking in a Hybrid Library Enivonment Part 2: SFX, a Generic Linking Solution"
  },
  "sdDatePublished": "2025-02-26T07:40:07.328Z",
  "sdPublisher": {
    "id": "https://mycontributions.info/service/m/profile/card#me",
    "type": "Service",
    "name": "Mastodon Bot"
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
