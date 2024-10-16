#!/usr/bin/env node
const { program } = require('commander');

const fetch = require('node-fetch');
const { generateQuads, serializeQuads, annotateByOrigin } = require('../lib/index');
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
    .argument('<file...>','CSL citation file or URL')
    .action( async(file) => {
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

            console.log(await serializeQuads(quads, { format: 'nquads' }));
        }
    });

program
    .command('event2rdf')
    .option('--origin <origin>','Original Event')
    .argument('<file>','Event file | URL')
    .action( async(file,opts) => {
        const all_opts = { ...opts, ...program.opts() };
        const rmlmapperPath = fsPath.resolve(all_opts.jar);
        const rmlmappingPath = fsPath.resolve(all_opts.map);
        const tempFolderPath = fsPath.resolve(all_opts.tmp);

        const data = await resolve(file);

        const referred_csl = await resolve(data.object.id);

        const map = fs.readFileSync(rmlmappingPath,'utf-8');
            
        const param = {
            rmlMapper : rmlmapperPath ,
            rmlMap : map,
            tmp : tempFolderPath
        };

        let quads = await generateQuads(referred_csl, param);

        if (opts.origin) {
            const origin = await resolve(opts.origin);
            quads = annotateByOrigin(quads,origin);
        }

        console.log(await serializeQuads(quads, { format: 'application/trig' }));
    });

program.parse();

async function resolve(ref) {
    if (ref.match(/^http/)) {
        const res = await fetch(ref);

        if (res.ok) {
            return await res.json();
        }
        else {
            console.error(`failed to fetch ${ref} : ${res.statusText}`);
        }
    }
    else {
        return JSON.parse(fs.readFileSync(ref,'utf-8'));
    }
}
