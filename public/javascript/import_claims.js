const CLAIM_BASE= 'https://mycontributions.info/service/c/trace?artifact=';

async function fetchClaims(url) {
    const claimUrl = CLAIM_BASE + url;
    const claimList = await fetchJSON(claimUrl);

    if (! claimList) {
        return null;
    }

    if (! claimList?.member || claimList.member.length == 0) {
        return null;
    }

    const claims = [];

    for (let i = 0 ; i < claimList.member.length ; i++) {
        const member = await fetchJSON(claimList.member[i].id);
        const about  = aboutSection(member);
        claims.push({ member: member , about: about });
    }

    return claims;
}

function createCitation(data) {
    const citation = [];
    const member = data['member'];
    const about = data['about'];
    let hasAuthor = false;

    if (about['author']) {
        if (Array.isArray(about['author'])) {
            const authors = [];
            about['author'].forEach( auth => {
                if (auth['familyName'] && auth['givenName']) {
                    authors.push(`${auth['familyName']}, ${auth['givenName'].substr(0,1)}.`);
                }
                else if (auth['familyName']) {
                    authors.push(`${auth['familyName']}`); 
                }
            });
            citation.push(authors.join(", "));
        }
        else if (isObject(about['author'])) {
            if (auth['familyName'] && auth['givenName']) {
                citation.push(`${auth['familyName']}, ${auth['givenName'].substr(0,1)}.`);
            }
            else if (auth['familyName']) {
                citation.push(`${auth['familyName']}`); 
            } 
        }

        hasAuthor = true;
    }

    if (hasAuthor && about['datePublished']) {
        citation.push(`(${about['datePublished']})`);
    }

    if (about['title']) {
        if (citation.length) {
            citation.push(". ");
        }

        citation.push(`<i>${about['title']}</i>`);
    }

    if (!hasAuthor && about['datePublished']) {
        citation.push(`(${about['datePublished']})`);
    }

    if (about['publisher']) {
        citation.push(about['publisher']);
    }
    else {
        const publisher = about['id']
                            .replaceAll(/^https?:\/\//g,'')
                            .replaceAll(/\/.*/g,'')
                            .toUpperCase();
        citation.push(publisher);
    }

    citation.push(`<a href="${about['id']}">[Full Text]</a>`);

    return citation.join(". ");
}

function isObject (value) {  
  return Object.prototype.toString.call(value) === '[object Object]'
}

async function fetchJSON(url) {
    console.log(`fetching ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
        console.log(`aarg..failed: ${response.statusText}`);
        return null;
    }

    const json = await response.json();

    return json;
}

function aboutSection(data) {
    if (!data['about']) {
        return null;
    }
    const firstKey = Object.keys(data.about)[0];
    return data.about[firstKey];
}