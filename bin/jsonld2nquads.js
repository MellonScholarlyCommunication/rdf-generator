#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');
const { rdfParser } = require('rdf-parse');
const { rdfSerializer } = require('rdf-serialize');
const streamifyArray = require('streamify-array');
const stringifyStream = require('stream-to-string');

const file = process.argv[2];

if (! file) {
    console.error(`usage: jsonld2nquads.js file`);
    process.exit(1);
}

main();

async function main() {
    const inputStream = fs.createReadStream(file);
    const lineReader = readline.createInterface({
        input: inputStream,
        terminal: false
    });
    lineReader.on("line", async (line) => {
        const quads = await parse(line);
        await serialize(quads);
    });
}

async function serialize(quads) {
    const quadStream = streamifyArray(quads);
    const textStream = rdfSerializer.serialize(quadStream, { contentType : 'application/n-quads'});

    textStream.pipe(process.stdout)
        .on('error', (error) => console.error(error))
        .on('end', () => console.error('done'));
}

async function parse(line) {
    return new Promise( (resolve,reject) => {
        const textStream = require('streamify-string')(line);
        const quads = [];

        rdfParser.parse(textStream, { contentType: 'application/ld+json'})
            .on('data', (quad) => quads.push(quad))
            .on('error', (error) => console.log(error))
            .on('end', () => resolve(quads));
    });
}