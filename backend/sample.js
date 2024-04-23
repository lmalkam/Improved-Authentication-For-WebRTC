function sha256(data) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }

    function toHexString(byteArray) {
        return Array.from(byteArray, byte => {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('');
    }

    const K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
        0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
        0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
        0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
        0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
        0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
        0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
        0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    const initialHashValues = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];

    const message = Buffer.from(data, 'utf8');
    let messageArray = [];

    for (let i = 0; i < message.length; i++) {
        messageArray[i >> 2] |= message[i] << (24 - 8 * (i % 4));
    }

    const messageLength = message.length * 8;
    messageArray[message.length >> 2] |= 0x80 << (24 - 8 * (message.length % 4));
    messageArray[(((message.length + 64) >> 9) << 4) + 15] = messageLength;

    let H = [...initialHashValues];

    for (let i = 0; i < messageArray.length; i += 16) {
        let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];

        for (let j = 0; j < 64; j++) {
            let S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
            let ch = (e & f) ^ (~e & g);
            let temp1 = h + S1 + ch + K[j] + messageArray[i + j];
            let S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
            let maj = (a & b) ^ (a & c) ^ (b & c);
            let temp2 = S0 + maj;

            h = g;
            g = f;
            f = e;
            e = d + temp1;
            d = c;
            c = b;
            b = a;
            a = temp1 + temp2;
        }

        H[0] += a;
        H[1] += b;
        H[2] += c;
        H[3] += d;
        H[4] += e;
        H[5] += f;
        H[6] += g;
        H[7] += h;
    }

    return toHexString(Buffer.from(H.reduce((output, hash) => {
        return output.concat([(hash >>> 24) & 0xFF, (hash >>> 16) & 0xFF, (hash >>> 8) & 0xFF, hash & 0xFF]);
    }, [])));
}

function toHexString(byteArray) {
    return Array.from(byteArray, byte => {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
}

// Example usage:
const inputData = 'Hello, World!';
const hashedData = sha256(inputData);
console.log(`SHA-256 hash of "${inputData}": ${hashedData}`);
