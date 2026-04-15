# RDF Generator

Tooling to generate Claim RDF from [CSL](https://docs.citationstyles.org/en/stable/specification.html#csl-1-0-2-specification) (Citation Style Language) data.


## Install

```
yarn install
yarn run download:rmlmapper
```

## Configuration

```
cp .env-example .env
```

The the section "Configuration Options" below.

## RDF Model

![Alt text](./claim_summary.svg)

The RDF model of a claim is based on two parts:

- A *provenance* section that makes factual statements about who created the claim, at what time, and which system was used to process the claim
- A *metadata* section that provides the generated metadata for the claim

The **Creator** of a claim is the researcher on a social platform.

The **Publisher** of a claim is the service that generated the RDF model.

The **Artifact** is the generated metadata for the IRI in the claim.

For the mapping we use RDF Mapping Language from [RML.io](https://rml.io). See
`config/mapping.ttl` for the mapping file.

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
    "id": "https://claimbot.surf.nl/profile/card#me",
    "type": "Service",
    "name": "SURF Claim Bot"
  }
}
```

## Demo

```
./bin/rdf_admin.js csl2rdf dev/citation1.json
<https://www.dlib.org/dlib/april99/van_de_sompel/04van_de_sompel-pt2.html> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/net/xbiblio/csl#webpage> .
<https://www.dlib.org/dlib/april99/van_de_sompel/04van_de_sompel-pt2.html> <https://schema.org/title> "Reference Linking in a Hybrid Library Enivronment Part 2: SFX, a Generic Linking Solution" .
```

## Claimlog Server

A web service can be provided that automatically transforms CSL claims into RDF claims. Two options are available:

1) Run a claimlog server on the same server as an eventlog-server and import the eventlog of the claimbot
2) Start a claimlog service with Event Notifications
   - A claim log can send a notification to the claimlog to read a CSL from a remote eventlog server

The steps below will demonstrate both options.

### Start the local database

```
yarn db-start
```

Stop the database with:

```
yarn db-stop
```

Execute an interactive psql shell 

```
yarn db-shell
```

### Create a claims database

Create the database:

```
npx event_admin init --name claims
```

### Import data locally 

**Requires a local `cache` database (e.g. when running on the same server as the eventlog-server)**

Import data from a local 'cache' database (see eventlog-server) into the 'claims' database:

```
./bin/rdf_admin.js import
```

By default, existing RDF data will not be overwritten. Use the `--overwrite` option to overwrite old data/

### Import data remotely 

Start a server that provides an LDN inbox:

```
yarn server
```

Visit: http://localhost:3006/

Use the LDN inbox handler to processed incoming request for import of an Event trace:

```
yarn handle-inbox
```

Post an Event trace to the inbox to generate a new Claim RDF:

```
curl -X POST -H 'Content-Type: application/ld+json' --data-binary '@import/demo-notification-1.jsonld' http://localhost:3006/inbox/
```

or

```
yarn demo-post
```

Start one run of the LDN inbox handler to process the incoming notification:

```
yarn handle-inbox
```

### Export data

Export all claims as JSONLD:

```
npx event_admin export --intention rdf
```

Export all claims as NQuads:

```
npx event_admin export --intention rdf | ./bin/jsonld2nquads.js /dev/stdin
```

### Remove data

Remove all the data from the claims database:

```
npx event_admin remove-all --name claims
```

### Public claim lookup

The claimlog server installation also includes a small demonstrator how the claims can be presented as a single page app to end users.

http://localhost:3006/#https://research.test.edu.nl/@alsvanounds

where

https://research.test.edu.nl/@alsvanounds 

is the Mastodon profile of a researcher.

## Configuration Options

The [RML](https://rml.io) mapping file used for CSL to RDF mapping can be found in `./config/mapping.ttl`.

The JSON-LD frame for the claims can be found in `./config/claim.jsonld` and is published online as https://mycontributions.info/contexts/claim.jsonld

**CLAIMLOG_URL**

The base URL of the claimlog service.

**LDN CONFIGURATION**

- `LDN_SERVER_BASEURL` : The base URL of the claimlog inbox service (that provides a `/inbox/`)
- LDN_SERVER_PORT : The port of the inbox service
- LDN_SERVER_PUBLIC_PATH : The path the public served static files
- LDN_SERVER_INBOX_CONFIG : The handler sequence for incoming notifications
  - For `@handler/notification_handler/jsonpath_filter.js` the `$.actor.id` value should match the WebID of the claim bot
- LDN_SERVER_OTHER_CONFIG : Configuration settings for open/hidden inboxes
  - At least the inbox should be public writable
  - A public readable inbox is optional (for demo/debug purposes)

**POSTGRES CONFIGURATION**

- `POSTGRES_HOST` : location of the PostgreSQL database (empty: local)
- `POSTGRES_PORT`
- `POSTGRES_DATABASE`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `CACHE_NAME` : name of the claims table

**RMLMAPPER CONFIGURATION**

- `RMLMAPPER` : the path to the RML mapper JAR file
- `RMLMAP` : the RML map to used to generate RDF from CSL
- `TEMPDIR` : a temporary process directory

**RDF CONFIGURATION**

- `CONTEXT_URL` : the URL of the published JSON-LD frame for claims

**IMPORT CONFIGURATION**

- `METADATA_ACTOR` : when importing metadata remotely, the URL in this configuration should match the WebID of the trusted metadata summarizer