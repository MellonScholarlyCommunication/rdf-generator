const fetch = require('node-fetch');

const CLAIM_SERVICE = "https://wiki.mycontributions.info";
const VERIFICATION_SERVICE = "https://mycontributions.info/profiles";

const CLAIM_SERVICE_PROP = "https://mycontributions.info/ns#claimProfile";
const VERIFICATION_SERVICE_PROP = "https://mycontributions.info/ns#verificationProfile";

async function resolveVerifiedLinks(profile) {
    try {
        const res = await fetch(profile, {
            method: 'GET',
            headers: {
                accept: 'application/ld+json'
            }
        });

        if (! res.ok) {
            return null;
        }

        const data = await res.json();

        if (! data['attachment']) {
            return [];
        }

        const record = [];

        for (let i = 0 ; i < data['attachment'].length ; i++) {
            const value = data['attachment'][i].value.replaceAll(/<([^>]+)>/ig,'');

            if (value.startsWith(CLAIM_SERVICE)) {
                record.push([ CLAIM_SERVICE_PROP, value ]);
            } 
            else if (value.startsWith(VERIFICATION_SERVICE)) {
                record.push([ VERIFICATION_SERVICE_PROP, value ]);
            }
            else {
                // Ok, an unknown URL
            }
        }

        return record;
    } catch (e) {
        return [];
    }
}

module.exports = {
    resolveVerifiedLinks
};