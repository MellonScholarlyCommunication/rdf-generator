function claimUrl(url) {
    let claim_base;

    if (CLAIM_BASE) {
        claim_base = CLAIM_BASE;
    }
    else {
        claim_base = 'https://mycontributions.info/service/c';
    }

    return claim_base + '/trace?artifact=' + url;
}

async function fetchClaims(url) {
    const claimList = await fetchJSON(claimUrl(url));

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
                    authors.push(`${auth['familyName']}, ${auth['givenName'].substr(0,1)}`);
                }
                else if (auth['familyName']) {
                    authors.push(`${auth['familyName']}`); 
                }
            });
            citation.push(authors.join(", "));
        }
        else if (isObject(about['author'])) {
            if (about['author']['familyName'] && about['author']['givenName']) {
                citation.push(`${about['author']['familyName']}, ${about['author']['givenName'].substr(0,1)}`);
            }
            else if (about['author']['familyName']) {
                citation.push(`${about['author']['familyName']}`); 
            } 
        }

        hasAuthor = true;
    }

    if (hasAuthor && about['datePublished']) {
        citation.push(`(${about['datePublished']})`);
    }

    if (about['title']) {
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

    if (about['dateRead']) {
        citation.push(`Accessed ${about['dateRead']}`);
    }

    citation.push(`<a href="${about['id']}">[Full Text]</a>`);

    return citation.filter(n=>n.match(/\S/)).join(". ");
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

async function makeHTMLTemplate(url) {
    if (!url) {
        return null;
    }

    const response = await fetch(CLAIM_BASE + '/demo.html');

    if (response.ok) {
        const text = await response.text();
        return text.replaceAll('DEMO_ARTIFACT',url);
    }
    else {
        return null;
    }
}