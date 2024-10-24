const cache = require('eventlog-server');
const fetch = require('node-fetch');
const { generateQuads, serializeQuads, annotateByOrigin } = require('../lib/index');

const METADATA_ACTOR = "https://mycontributions.info/service/x/profile/card#me";

async function internalImport(cacheName, opts) {
    const param = { name: cacheName };

    // Go over the list of generated events ; (original=NULL) means = trigger events...
    const list = await cache.listCache('','original=NULL', param);

    for (let i = 0 ; i < list.length ; i++) {
        const triggerNotification = await cache.getCache(list[i], param);

        // Check if we already processed them...
        if (! opts.overwrite && await knownEvent(triggerNotification.id)) {
            console.log(`${triggerNotification.id} (skipping)`);
            continue;
        }

        // Find the zotero response
        const summary = await cache.listCache('',`original=${triggerNotification.id}`, param);
        let metadataNotification;

        INNER: for (let j = 0 ; j < summary.length ; j++) {
            const eventNotification = await cache.getCache(summary[j], param); 

            if (eventNotification.type === 'Announce' && 
                eventNotification.actor.id === METADATA_ACTOR
            ) {
                metadataNotification = eventNotification;
                break INNER;
            }
        }

        if (metadataNotification) {
            await claimImport(triggerNotification,metadataNotification, opts);
        }
        else {
            console.error(`no metadata notification found for ${triggerNotification.id}`);
        }
    }
}

async function claimImport(triggerNotification, metadataNotification, param) {
    // Resolve the CSL data;
    const res = await fetch(metadataNotification.object.id);
    let csl;

    if (res.ok) {
        csl = await res.json();
    }
    else {
        console.error(`failed to resolve ${metadataNotification.object.id}`);
        return;
    }

    // Extract the mainTopic from the metadataNotification
    param['mainTopic'] = metadataNotification.context;

    // Generate RDF from the extracted CSL
    let quads = await generateQuads(csl, param);

    quads = await annotateByOrigin(quads,triggerNotification);

    const data = await serializeQuads(quads, { 
                    format: param.format , 
                    frame: param.frame ,
                    blob: true
                });

    if (process.env.CONTEXT_URL) {
        data['@context'] = process.env.CONTEXT_URL;
    }

    // Store the results
    const id = await cache.addCache(data, {
        original: triggerNotification.id
    } , { name: process.env.CACHE_NAME });

    console.log(id);
}

async function knownEvent(id) {
    const param = { name: process.env.CACHE_NAME };
    const result = await cache.listCache('',`original=${id}`,param);
    return result && result.length > 0 ? true : false;
}

module.exports = { internalImport };