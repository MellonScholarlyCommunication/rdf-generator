const RMLMapperWrapper = require('@rmlio/rmlmapper-java-wrapper');
const N3 = require('n3');
const { Writer , DataFactory } = N3;
const fs = require('fs');
const fsPath = require('path');
const { v4: uuidv4 } = require('uuid');
const RDF_NS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const SCHEMA_NS = 'https://schema.org/';

async function generateQuads(input, opts) {
    const what = uuidv4();

    const rml  = patchMapping(opts.rmlMap,what);
    const data = patchCSL(input);
    
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

function mainSubjects(input) {
    const data = patchCSL(input);
    if (data) {
        return data.map( (item) => item['URL']).filter( (item) => item !== undefined );
    }
    else {
        return null;
    }
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
    return new Promise( (resolve,reject) => {
        const writer = new Writer(opts);

        writer.addQuads(quads);
        writer.end( (error, result) => {
            if (error) {
                reject(error);
            }

            resolve(result);
        });
    });
}

function patchMapping(map,what) {
    const patched = map.replace(/%%FILE%%/g,`${what}.json`);
    return patched;
}

function patchCSL(data) {
    for (let i = 0 ; i < data.length ; i++) {
        // Set a URL when none is given
        if (! data[i]['URL']) {
            if (data[i]['DOI']) {
                data[i]['URL'] = `https://doi.org/${data[i]['DOI']}`;
            }
            else {
                console.error(`warning: data[${i}] no URL and no DOI!`);
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
    }

    return data;
}

function genId() {
    return `urn:uuid:${uuidv4()}`;
}

module.exports = { 
    generateQuads , 
    serializeQuads , 
    mainSubjects ,
    nameTheseQuads ,
    annotateTheseQuads ,
    annotateByOrigin,
    genId
};