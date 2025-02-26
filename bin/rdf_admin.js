#!/usr/bin/env node
const { program } = require('commander');

const fetch = require('node-fetch');
const { generateQuads, serializeQuads, annotateByOrigin } = require('../lib/index');
const { internalImport } = require('../lib/import');
const cache = require('eventlog-server');
const fs = require('fs');
const fsPath = require('path');

require('dotenv').config();

program
    .name('rdf_admin.js')
    .option(`--jar <jar>`,'RML Mapper jar to use', process.env.RMLMAPPER)
    .option(`--map <map>`,'RML Map to use', process.env.RMLMAP)
    .option(`--tmp <dir>`,'Temporary folder', process.env.TEMPDIR);

program
    .command('csl2rdf')
    .option('-f,--format <format>','output format','application/n-quads')
    .option('-r,--frame <frame>','jsonld frame')
    .argument('<file...>','CSL citation file or URL')
    .action( async(file,opts) => {
        const format = opts.format;
        let frame;

        if (opts.frame) {
            frame = JSON.parse(fs.readFileSync(opts.frame,'utf8'));
        }

        for (let i = 0 ; i < file.length ; i++) {
            const ref = file[i];

            const opts = program.opts();
            const rmlmapperPath = fsPath.resolve(opts.jar);
            const rmlmappingPath = fsPath.resolve(opts.map);
            const tempFolderPath = fsPath.resolve(opts.tmp);

            const data = await resolve(ref);

            const map = fs.readFileSync(rmlmappingPath,'utf-8');
            
            const param = {
                rmlMapper : rmlmapperPath ,
                rmlMap : map,
                tmp : tempFolderPath
            };

            const quads = await generateQuads(data, param);

            console.log(await serializeQuads(quads, { format: format , frame: frame }));
        }
    });

program
    .command('event2rdf')
    .option('--cache <cache>','cache name','cache')
    .option('-f,--format <format>','output format','application/trig')
    .option('-r,--frame <frame>','jsonld frame')
    .option('--origin <origin>','Original Event')
    .argument('<file>','Event file | URL | id')
    .action( async(file,opts) => {
        const all_opts = { ...opts, ...program.opts() };
        const rmlmapperPath = fsPath.resolve(all_opts.jar);
        const rmlmappingPath = fsPath.resolve(all_opts.map);
        const tempFolderPath = fsPath.resolve(all_opts.tmp);

        let frame;

        if (opts.frame) {
            frame = JSON.parse(fs.readFileSync(opts.frame,'utf8'));
        }

        const data = await resolve(file, { name: all_opts.cache});

        const referred_csl = await resolve(data.object.id);

        const map = fs.readFileSync(rmlmappingPath,'utf-8');
            
        const param = {
            rmlMapper : rmlmapperPath ,
            rmlMap : map,
            tmp : tempFolderPath ,
            mainTopic : data.context
        };

        let quads = await generateQuads(referred_csl, param);

        if (opts.origin) {
            const origin = await resolve(opts.origin, { name: all_opts.cache });
            quads = await annotateByOrigin(quads,origin);
        }

        console.log(await serializeQuads(quads, { format: opts.format , frame: frame }));
    });

program
    .command('import')
    .option('--cache <cache>','cache name','cache')
    .option('-f,--format <format>','output format','application/ld+json')
    .option('-r,--frame <frame>','jsonld frame','config/claim.jsonld')
    .option('--overwrite','Overwrite existing claims')
    .action( async (opts) => {
        const all_opts = { ...opts, ...program.opts() };

        const rmlmapperPath = fsPath.resolve(all_opts.jar);
        const rmlmappingPath = fsPath.resolve(all_opts.map);
        const tempFolderPath = fsPath.resolve(all_opts.tmp);

        const map = fs.readFileSync(rmlmappingPath,'utf-8');

        let frame;

        if (all_opts.frame) {
            frame = JSON.parse(fs.readFileSync(all_opts.frame,'utf8'));
        }
            
        const param = {
            rmlMapper : rmlmapperPath ,
            rmlMap : map,
            tmp : tempFolderPath ,
            format: all_opts.format ,
            frame : frame ,
            overwrite : all_opts.overwrite
        };
 
        await internalImport(opts.cache, param);
    });

program.parse();

async function resolve(ref,param) {
    if (ref.match(/^http/)) {
        const res = await fetch(ref);

        if (res.ok) {
            return await res.json();
        }
        else {
            console.error(`failed to fetch ${ref} : ${res.statusText}`);
        }
    }
    else if (ref.match(/^urn:uuid/)) {
        const res = await cache.getCache(ref,param);

        if (!res) {
            console.error(`failed to find ${ref} in ${param.name}`);
        }
        
        return res;
    }
    else {
        return JSON.parse(fs.readFileSync(ref,'utf-8'));
    }
}
