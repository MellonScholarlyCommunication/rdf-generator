# Docker

Build a version of a docker image:

```
docker build . -t hochstenbach/rdf-generator:v0.0.2
```

Run a docker image:

```
docker container run --env-file .env -p 3006:3006 --rm hochstenbach/rdf-generator:v0.0.2
```

Push it to DockerHub:

```
docker push hochstenbach/rdf-generator:v0.0.2
```