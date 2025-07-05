const CLAIM_BASE = '';

function claimUrl(url) {
    return CLAIM_BASE + 'trace?artifact=' + url;
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
            sortedAuthors(about['author']).forEach( auth => {
                const familyName = auth['familyName'];
                const givenName = auth['givenName'];
                if (familyName !== "" && givenName !== "") {
                    authors.push(`${familyName}, ${givenName.substr(0,1)}`);
                }
                else if (familyName !== "") {
                    authors.push(familyName); 
                }
            });
            citation.push(authors.join(", "));
        }
        else if (isObject(about['author'])) {
            const familyName = ensureString(about['author']['familyName']);
            const givenName = ensureString(about['author']['givenName']);
            if (familyName !== "" && givenName !== "") {
                citation.push(`${familyName}, ${givenName.substr(0,1)}`);
            }
            else if (familyName !== "") {
                citation.push(familyName); 
            } 
        }

        hasAuthor = true;
    }

    if (hasAuthor && about['datePublished']) {
        citation.push(`(${ensureString(about['datePublished'])})`);
    }

    if (about['title']) {
        citation.push(`<i>${ensureString(about['title'])}</i>`);
    }

    if (!hasAuthor && about['datePublished']) {
        citation.push(`(${ensureString(about['datePublished'])})`);
    }

    if (about['publisher']) {
        citation.push(ensureString(about['publisher']));
    }
    else {
        const publisher = ensureString(about['id'])
                            .replaceAll(/^https?:\/\//g,'')
                            .replaceAll(/\/.*/g,'')
                            .toUpperCase();
        citation.push(publisher);
    }

    if (about['dateRead']) {
        citation.push(`Accessed ${ensureString(about['dateRead'])}`);
    }

    citation.push(`<a href="${about['id']}">[Full Text]</a>`);

    return citation.filter(n=>n.match(/\S/)).join(". ");
}

function sortedAuthors(authors) {
    if (!authors) {
        return authors;
    }
    else if (! authors[0]['position']) {
        return authors;
    }
    else {
        return authors.slice().sort( (a,b) => a.position - b.position );
    }
}

function ensureString(value) {
    if (!value) {
        return "";
    }
    else if (typeof value === 'string' || value instanceof String) {
        return value;
    }
    else if (Array.isArray(value)) {
        return value.join(" ");
    }
    else if (typeof value === 'object') {
        return "<OBJECT>";
    }
    else {
        return "";
    } 
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
