const { getLogger, backOff_fetch } = require('ldn-inbox-server');
const { knownEvent , claimImport } = require('../lib/import');
const logger = getLogger();
const fs = require('fs');
const fsPath = require('path');

async function handle({path,options,config,notification}) {
    if (! config) {
        logger.error('no configuration found');
        return { path, options, success: false };
    }

    const param = {
        rmlMapper : fsPath.resolve(process.env.RMLMAPPER),
        rmlMap : fs.readFileSync(process.env.RMLMAP,'utf-8'),
        tmp : fsPath.resolve(process.env.TEMPDIR) ,
        format: 'application/ld+json' ,
        frame : JSON.parse(fs.readFileSync('./config/claim.jsonld')) ,
        overwrite : false,
    };

    try {
        const trace_url = notification.object.id;

        if (! trace_url) {
            logger.error(`failed to find object.id in notification`);
            return { path, options, success: false };
        }

        const parsed = await parseTrace(trace_url);

        if (! parsed) {
            logger.error(`failed to parse notification ${trace_url}`);
            return { path, options, success: false };
        }

        const triggerNotification = parsed[0];
        const metadataNotification = parsed[1];

        if (await knownEvent(triggerNotification.id)) {
            logger.info(`already seen ${triggerNotification.id}`);
            return { path, options, success: true };
        }
        else {        
            logger.info(`claim import`);
            
            await claimImport(triggerNotification,metadataNotification,param);

            return { path, options, success: true };
        }
    } 
    catch (e) {
        logger.error(`failed to process ${path}`);
        logger.error(e);
        return { path, options, success: false };
    }
}

async function parseTrace(url) {
    try {
        logger.info(`fetching ${url}`);
        const response = await backOff_fetch(url, { method: 'GET' });

        if (!response.ok) {
            logger.error(`failed to parse ${url}`);
            return null;
        }

        const trace = await response.json();

        if (!trace?.member) {
            logger.warn(`no member in trace ${url}`);
            return null;
        }

        let triggerNotification;
        let metadataNotification;

        logger.info(`trying to find Announce-s from ${process.env.METADATA_ACTOR}...`);

        for (let i = 0 ; i < trace.member.length ; i++) {
            const member = trace.member[i];
            const id = member.id;

            logger.info(`fetching trace member ${id}`);
            const response = await backOff_fetch(id, { method: 'GET' });

            if (!response.ok) {
                logger.error(`failed to fetch ${id}`);
                continue;
            }

            const candidateNotification = await response.json();

            if (i == 0) {
                triggerNotification = candidateNotification;
            }
            else if (candidateNotification.actor.id === process.env.METADATA_ACTOR) {
                metadataNotification = candidateNotification;
                break;
            }
        }

        if (triggerNotification && metadataNotification) {
            return [ triggerNotification , metadataNotification ];
        }
        else {
            logger.error(`can't find a trigger/metadata combo for ${url}`);
            return null;
        }
    }
    catch (e) {
        logger.error(`failed to parse ${url}`);
        return null;
    }
}

module.exports = { handle };