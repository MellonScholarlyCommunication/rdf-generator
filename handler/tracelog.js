const url = require('url');
const cache = require('eventlog-server');
const logger = require('ldn-inbox-server').getLogger();
const md5 = require('md5');

async function handle(req,res,options) {
    const parsedUrl = url.parse(req.url,true);
    const queryObject = parsedUrl.query;
    const artifact = queryObject.artifact;
    const cacheName = 'claims';

    if (parsedUrl.pathname.includes("/urn:uuid")) {
        return handleEvent(req,res,options,{ name: cacheName });
    }

    res.setHeader('Content-Type','application/ld+json');
    res.setHeader('Access-Control-Allow-Origin','*');

    if (! artifact) {
        res.writeHead(404);
        res.end(JSON.stringify({ error : `need artifact parameter`}));
        return;
    }
   
    const claims = await resolveClaimLog(artifact, { name: cacheName });

    if (! claims) {
        res.writeHead(404);
        res.end(JSON.stringify({ error : `no claims for ${artifact}`}));
        return;
    }

    const traceLog = {
        "@context" : "https://labs.eventnotifications.net/contexts/eventlog.jsonld",
        "id": `${process.env.CLAIMLOG_BASEURL}${req.url}`, 
        "type": "EventLog",
        "artifact": artifact,
        "member": []
    };

    for (let i = 0 ; i < claims.length ; i++) {
        const claim = claims[i];
        const checksum = md5(makeEvent(claim));
        traceLog.member.push({
            id: `${process.env.CLAIMLOG_BASEURL}${parsedUrl.pathname}/${claim.id}` ,
            created: claim.sdDatePublished,
            checksum: {
                type: "Checksum",
                algorithm: "spdx:checksumAlgorithm_md5",
                checksumValue: checksum
            }
        });
    }

    res.writeHead(200);
    res.end(JSON.stringify(traceLog));
}

async function handleEvent(req,res,options,param) {
    const parsedUrl = url.parse(req.url,true);
    const id = parsedUrl.pathname.replace(/\/trace\//,'');

    const claim = await resolveClaim(id,param);
    
    res.setHeader('Content-Type','application/ld+json');
    res.setHeader('Access-Control-Allow-Origin','*');

    if (! claim) {
        res.writeHead(404);
        res.end(JSON.stringify({ error : `need such event ${id}`}));
        return;
    }

    res.writeHead(200);
    res.end(makeEvent(claim));
}

function makeEvent(claim) {
    return JSON.stringify(claim);
}

async function resolveClaim(id,param) {
    logger.debug(`resolveClaim(${id},${param})`);
    try {
        const event = await cache.getCache(id,param);
        return event;
    }
    catch (e) {
        logger.error(e);
        return null; 
    }
}

async function resolveClaimLog(url,param) {
    logger.debug(`resolveClaimLog(${url},${param})`);

    try {
        const claims = await cache.listCache(`creator.id=${url}`,'',param);

        if (claims.length == 0) {
            return null;
        }

        const resolved = [];

        for (let i = 0 ; i < claims.length ; i++) {
            const event = await cache.getCache(claims[i],param); 
            resolved.push(event);      
        }

        return resolved;
    }
    catch (e) {
        logger.error(e);
        return null;
    }
}

module.exports = { handle };