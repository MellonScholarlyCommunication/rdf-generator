const RMLMapperWrapper = require('@rmlio/rmlmapper-java-wrapper');
const N3 = require('n3');
const { DataFactory } = N3;
const { rdfSerializer } = require("rdf-serialize");
const jsonld = require('jsonld');
const streamifyArray = require("streamify-array");
const stringifyStream = require("stream-to-string");
const { v4: uuidv4 } = require('uuid');
const RDF_NS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const SCHEMA_NS = 'http://schema.org/';

async function generateQuads(input, opts) {
    const what = uuidv4();

    const rml  = patchMapping(opts.rmlMap,what);
    const data = patchCSL(input,opts);
    
    const wrapper = new RMLMapperWrapper(opts.rmlMapper,opts.tmp, true);
    const sources = {
        [`${what}.json`]: JSON.stringify(data)
    };
    
    const result = await wrapper.execute(rml, { sources, generateMetadata: false, asQuads: true});
    
    if (result) {
        return result.output;
    }
    else {
        return null;
    }
}

function annotateByOrigin(quads,origin) {
    const name = genId();
    const annotations = [];

    if (! origin.id) {
        console.error(`orgin.id missing`);
        return quads;
    }

    annotations.push(
        {
            subject: origin.id ,
            predicate: `${RDF_NS}type` ,
            object: `${SCHEMA_NS}Claim`
        }
    );

    annotations.push(
        {
            subject: origin.id ,
            predicate: `${SCHEMA_NS}about` ,
            object: name
        }
    );

    if (origin.actor?.id) {
        annotations.push(
            {
                subject: origin.id ,
                predicate: `${SCHEMA_NS}creator` ,
                object: origin.actor.id
            }
            ,
            {
                subject: origin.actor.id ,
                predicate: `${RDF_NS}type` ,
                object: `${SCHEMA_NS}Person`
            }
        );

        if (origin.actor?.name) {
            annotations.push(
                {
                    subject: origin.actor.id ,
                    predicate: `${SCHEMA_NS}name` ,
                    object: origin.actor.name
                }
            ); 
        }
    }

    if (origin.origin?.id) {
        annotations.push(
            {
                subject: origin.id ,
                predicate: `${SCHEMA_NS}sdPublisher` ,
                object: origin.origin.id
            } ,
            {
                subject: origin.origin.id ,
                predicate: `${RDF_NS}type` ,
                object: `${SCHEMA_NS}Service`
            } , 
        );

        if (origin.origin.name) {
            annotations.push(
                {
                    subject: origin.origin.id ,
                    predicate: `${SCHEMA_NS}name` ,
                    object: origin.origin.name
                } , 
            ); 
        }
    }

    if (origin.published) {
        annotations.push(
            {
                subject: origin.id ,
                predicate: `${SCHEMA_NS}sdDatePublished` ,
                object: origin.published
            }
        );
    }

    if (origin.object?.url?.[0].href) {
        annotations.push(
            {
                subject: origin.id ,
                predicate: `${SCHEMA_NS}mainEntity` ,
                object: origin.object?.url?.[0].href
            }
        );
    }

    quads = annotateTheseQuads(quads,name,annotations);

    return quads;
}

function annotateTheseQuads(quads,name,triples) {
    const newQuads = nameTheseQuads(quads,name);

    for (let i = 0 ; i < triples.length ; i++) {
        newQuads.push(
            DataFactory.quad(
                DataFactory.namedNode(triples[i].subject) ,
                DataFactory.namedNode(triples[i].predicate) ,
                triples[i].object.match(/^(http|urn)/) ?
                    DataFactory.namedNode(triples[i].object) :
                    DataFactory.literal(triples[i].object)      
            )
        );
    }

    return newQuads;
}

function nameTheseQuads(quads,name) {
    name = name || genId();

    const newQuads = [];

    for (let i = 0 ; i < quads.length ; i++) {
        const quad = quads[i];
        
        newQuads.push( DataFactory.quad(
            quad.subject,
            quad.predicate,
            quad.object,
            DataFactory.namedNode(name)
        ));
    }

    return newQuads;
}

async function serializeQuads(quads, opts) {
    return new Promise( async (resolve,reject) => {
        const quadStream = streamifyArray(quads);
        const textStream = rdfSerializer.serialize(quadStream, {
            contentType: opts.format
        });

        const doc = await stringifyStream(textStream);

        if (opts.format === 'application/ld+json' && opts.frame) {
            const frame = await jsonld.frame(JSON.parse(doc), opts.frame);

            // json-ld has some issues to create the right frame.
            const newDoc = {};
            newDoc['@context'] = frame['@context'];
            newDoc['id'] = frame['id'];
            newDoc['type'] = frame['type'];
            newDoc['about'] = {
                [frame['schema:about']['id']] : frame['mainEntity']
            };
            newDoc['mainEntity'] = frame['mainEntity']['id'];
            newDoc['creator'] = frame['creator'];
            newDoc['sdDatePublished'] = frame['sdDatePublished'];
            newDoc['sdPublisher'] = frame['sdPublisher'];

            if (opts.blob) {
                resolve(newDoc);
            }
            else {
                resolve(JSON.stringify(newDoc,null,2));
            }
        }
        else {
            resolve(doc);
        }
    });
}

function patchMapping(map,what) {
    const patched = map.replace(/%%FILE%%/g,`${what}.json`);
    return patched;
}

function patchCSL(data, opts) {
    for (let i = 0 ; i < data.length ; i++) {
        // Set a URL when none is given
        if (! data[i]['URL']) {
            if (data[i]['DOI']) {
                data[i]['URL'] = `https://doi.org/${data[i]['DOI']}`;
            }
        }

        // Add unique identifiers to authors
        const author = data[i]['author'];
        if (author && Array.isArray(author)) {
            for (let j = 0 ; j < author.length ; j++) {
                author[j]['id'] = genId();
            }
        }

        // Add unique identifiers to editors
        const editor = data[i]['editor'];
        if (editor && Array.isArray(editor)) {
            for (let j = 0 ; j < editor.length ; j++) {
                editor[j]['id'] = genId();
            }
        }

        if (opts.mainTopic) {
            data[i]['mainTopic'] = opts.mainTopic;
        }
        else if (data[i]['URL']) {
            data[i]['mainTopic'] = data[i]['URL']
        }
        else {
            data[i]['mainTopic'] = genId();
        }
    }

    return data;
}

function genId() {
    return `urn:uuid:${uuidv4()}`;
}

module.exports = { 
    generateQuads , 
    serializeQuads , 
    nameTheseQuads ,
    annotateTheseQuads ,
    annotateByOrigin,
    genId
};