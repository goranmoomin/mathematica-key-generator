const magicNumbers = [
    0x29c2,
    0x2fdb,
    0x44f1,
    0x60f0,
    0x8250,
    0x8c68,
    0x8e3c,
    0xa439,
    0xa68b,
    0xabeb,
    0xd227,
    0xdb75,
    0xe4a8,
    0xe756,
    0xee71
];

function testSalt(a, b, c) {
    for(let i = 0; i < 8; i += 1) {
        let t = (b >> i) & 1;
        if (t + ((a - t) & ~1) === a) {
            a = (a - t) >> 1;
        } else {
            a = ((c - t) ^ a) >> 1;
        }
    }

    return a;
}

function genPassword(string, salt) {
    let uuid = string.split('').map(x => x.charCodeAt());

    let salt1 = salt;
    for(let i = uuid.length - 1; i >= 0; i -= 1) {
        salt1 = testSalt(salt1, uuid[i], 0x105C3);
    }

    let offset1 = 0;
    while (testSalt(testSalt(salt1, offset1 & 0xFF, 0x105C3), offset1 >> 8, 0x105C3) !== 0xA5B6) {
        offset1 ++;
        if (offset1 >= 0xFFFF) {
            return '';
        }
    }

    offset1 = parseInt(((offset1 + 0x72FA) & 0xFFFF) * 99999 / 0xFFFF, 10);
    offset1 = `0000${offset1}`.substr(-5);

    let salt2 = `${offset1.substr(0, 2)}${offset1.substr(3, 2)}${offset1.substr(2, 1)}`;
    salt2 = parseInt(salt2, 10);
    salt2 = parseInt((salt2 / 99999.0) * 0xFFFF, 10) + 1;
    salt2 = testSalt(testSalt(0, salt2 & 0xFF, 0x1064B), salt2 >> 8, 0x1064B);
    for(let i = uuid.length - 1; i >= 0; i -= 1) {
        salt2 = testSalt(salt2, uuid[i], 0x1064B);
    }

    let offset2 = 0;
    while(testSalt(testSalt(salt2, offset2 & 0xFF, 0x1064B),
                    offset2 >> 8, 0x1064B) !== 0xA5B6) {
        offset2 += 1;
        if (offset2 >= 0xFFFF) { return ''; }
    }

    offset2 = parseInt((offset2 & 0xFFFF) * 99999 / 0xFFFF, 10);
    offset2 = `0000${offset2}`.substr(-5);

    return [
        offset2[3],
        offset1[3],
        offset1[1],
        offset1[0],
        '-',
        offset2[4],
        offset1[2],
        offset2[0],
        '-',
        offset2[2],
        offset1[4],
        offset2[1],
        '::1'
    ].join('');
}

function keygen(mathID, activationKey = '1234-4321-123456') {
    return magicNumbers
        .map(magicNumber => genPassword(`${mathID}$1&${activationKey}`, magicNumber))
        .filter(password => password !== '');
}

document.querySelector('#button').onclick = function (e) {
    e.preventDefault();
    let formEl = document.querySelector('#form');
    if(formEl.reportValidity && !formEl.reportValidity()) { return; }
    let mathId = document.querySelector('#mathid').value;
    let activationKey = document.querySelector('#activation-key').value;
    let outputEl = document.querySelector('#output');
    outputEl.innerText = 'Password:';
    outputEl.append(document.createElement("br"));
    let passwordEl = document.createElement("pre");
    let passwordInnerCodeEl = document.createElement("code");
    passwordEl.append(passwordInnerCodeEl);
    passwordInnerCodeEl.innerText = keygen(mathId, activationKey).join('\n');
    outputEl.append(passwordEl);
};
