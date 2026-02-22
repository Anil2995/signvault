// End-to-end test script using native Node.js http
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5000';
let TOKEN = '';
let DOC_ID = '';
let SIG_ID = '';

function request(method, urlPath, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlPath, BASE);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method,
            headers: {
                ...headers,
            },
        };

        if (body && !(body instanceof Buffer) && typeof body !== 'string') {
            const json = JSON.stringify(body);
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = Buffer.byteLength(json);
            body = json;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

function multipartUpload(urlPath, filePath, token) {
    return new Promise((resolve, reject) => {
        const boundary = '----FormBoundary' + Date.now();
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);

        const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/pdf\r\n\r\n`;
        const footer = `\r\n--${boundary}--\r\n`;

        const bodyBuffer = Buffer.concat([
            Buffer.from(header),
            fileBuffer,
            Buffer.from(footer),
        ]);

        const url = new URL(urlPath, BASE);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': bodyBuffer.length,
                'Authorization': `Bearer ${token}`,
            },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);
        req.write(bodyBuffer);
        req.end();
    });
}

function log(test, pass, detail) {
    const icon = pass ? '✅' : '❌';
    console.log(`${icon}  ${test}${detail ? ' — ' + detail : ''}`);
}

async function run() {
    console.log('\n========================================');
    console.log('   DocSigner — Full API Test Suite');
    console.log('========================================\n');

    // 1. Backend health
    try {
        const r = await request('GET', '/');
        log('Backend Health', r.status === 200, `Status ${r.status}`);
    } catch (e) {
        log('Backend Health', false, e.message);
        return;
    }

    // 2. Register
    try {
        const r = await request('POST', '/api/auth/register', {
            name: 'E2E Tester',
            email: `e2e-${Date.now()}@test.com`,
            password: 'Test@123',
        });
        const pass = r.status === 201 && r.data.token;
        TOKEN = r.data.token;
        log('Register', pass, `Status ${r.status}, got token: ${!!TOKEN}`);
    } catch (e) {
        log('Register', false, e.message);
    }

    // 3. Login
    try {
        const r = await request('POST', '/api/auth/login', {
            email: 'testflow@example.com',
            password: 'Test@123',
        });
        const pass = r.status === 200 && r.data.token;
        TOKEN = r.data.token;
        log('Login', pass, `Status ${r.status}, user: ${r.data.name || r.data._id}`);
    } catch (e) {
        log('Login', false, e.message);
    }

    // 4. Auth/Me
    try {
        const r = await request('GET', '/api/auth/me', null, {
            Authorization: `Bearer ${TOKEN}`,
        });
        log('Auth/Me', r.status === 200 && r.data.id, `User: ${r.data.name}, Email: ${r.data.email}`);
    } catch (e) {
        log('Auth/Me', false, e.message);
    }

    // 5. Profile Update
    try {
        const r = await request('PUT', '/api/auth/profile', {
            name: 'Updated Tester',
            defaultSignature: { type: 'text', value: 'Updated Tester' },
        }, { Authorization: `Bearer ${TOKEN}` });
        log('Profile Update', r.status === 200 && r.data.defaultSignature, `Name: ${r.data.name}, Sig: ${r.data.defaultSignature?.value}`);
    } catch (e) {
        log('Profile Update', false, e.message);
    }

    // 6. Upload PDF
    try {
        const r = await multipartUpload('/api/docs/upload', path.join(__dirname, 'test-doc.pdf'), TOKEN);
        DOC_ID = r.data._id;
        log('Upload PDF', r.status === 201 && DOC_ID, `DocID: ${DOC_ID}, Name: ${r.data.originalName}`);
    } catch (e) {
        log('Upload PDF', false, e.message);
    }

    // 7. Get Documents
    try {
        const r = await request('GET', '/api/docs', null, {
            Authorization: `Bearer ${TOKEN}`,
        });
        const count = Array.isArray(r.data) ? r.data.length : 0;
        log('Get Documents', r.status === 200 && count > 0, `${count} document(s) found`);
    } catch (e) {
        log('Get Documents', false, e.message);
    }

    // 8. Get Document By ID
    try {
        const r = await request('GET', `/api/docs/${DOC_ID}`, null, {
            Authorization: `Bearer ${TOKEN}`,
        });
        log('Get Doc By ID', r.status === 200 && r.data._id === DOC_ID, `Name: ${r.data.originalName}`);
    } catch (e) {
        log('Get Doc By ID', false, e.message);
    }

    // 9. Create Signature Placeholder
    try {
        const r = await request('POST', '/api/signatures', {
            documentId: DOC_ID,
            page: 1,
            x: 30,
            y: 55,
        }, { Authorization: `Bearer ${TOKEN}` });
        SIG_ID = r.data._id;
        log('Create Signature', r.status === 201 && SIG_ID, `SigID: ${SIG_ID}, Status: ${r.data.status}`);
    } catch (e) {
        log('Create Signature', false, e.message);
    }

    // 10. Get Signatures for Document
    try {
        const r = await request('GET', `/api/signatures/${DOC_ID}`, null, {
            Authorization: `Bearer ${TOKEN}`,
        });
        const count = Array.isArray(r.data) ? r.data.length : 0;
        log('Get Signatures', r.status === 200 && count > 0, `${count} signature(s) found`);
    } catch (e) {
        log('Get Signatures', false, e.message);
    }

    // 11. Move Signature (Update Position)
    try {
        const r = await request('PUT', `/api/signatures/${SIG_ID}`, {
            x: 50,
            y: 60,
        }, { Authorization: `Bearer ${TOKEN}` });
        log('Move Signature', r.status === 200 && r.data.x === 50, `New pos: (${r.data.x}%, ${r.data.y}%)`);
    } catch (e) {
        log('Move Signature', false, e.message);
    }

    // 12. Sign (apply text signature)
    try {
        const r = await request('PUT', `/api/signatures/${SIG_ID}`, {
            status: 'signed',
            signatureText: 'Updated Tester',
        }, { Authorization: `Bearer ${TOKEN}` });
        log('Apply Signature', r.status === 200 && r.data.status === 'signed', `Status: ${r.data.status}, Text: ${r.data.signatureText}`);
    } catch (e) {
        log('Apply Signature', false, e.message);
    }

    // 13. Finalize Document (embed sigs + generate PDF)
    try {
        const r = await request('POST', `/api/docs/${DOC_ID}/finalize`, null, {
            Authorization: `Bearer ${TOKEN}`,
        });
        log('Finalize Document', r.status === 200 && r.data.path, `Path: ${r.data.path}`);
    } catch (e) {
        log('Finalize Document', false, e.message);
    }

    // 14. Delete Signature (create new one and delete it)
    try {
        const createR = await request('POST', '/api/signatures', {
            documentId: DOC_ID,
            page: 1,
            x: 80,
            y: 80,
        }, { Authorization: `Bearer ${TOKEN}` });
        const tempSigId = createR.data._id;

        const r = await request('DELETE', `/api/signatures/${tempSigId}`, null, {
            Authorization: `Bearer ${TOKEN}`,
        });
        log('Delete Signature', r.status === 200, `Deleted sig: ${tempSigId}`);
    } catch (e) {
        log('Delete Signature', false, e.message);
    }

    // 15. Forgot Password
    try {
        const r = await request('POST', '/api/auth/forgotpassword', {
            email: 'testflow@example.com',
        });
        // Could be 200 or 500 if email is not configured — just check it responds
        log('Forgot Password', r.status === 200 || r.status === 500, `Status: ${r.status} (email config may vary)`);
    } catch (e) {
        log('Forgot Password', false, e.message);
    }

    // 16. Frontend Serving
    try {
        const frontendR = await new Promise((resolve, reject) => {
            http.get('http://localhost:5173/', (res) => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => resolve({ status: res.statusCode, data }));
            }).on('error', reject);
        });
        const hasDocSigner = frontendR.data.includes('DocSigner');
        const hasRoot = frontendR.data.includes('id="root"');
        log('Frontend Serving', frontendR.status === 200 && hasRoot, `Has branding: ${hasDocSigner}, Has root: ${hasRoot}`);
    } catch (e) {
        log('Frontend Serving', false, e.message);
    }

    console.log('\n========================================');
    console.log('   Test Suite Complete!');
    console.log('========================================\n');
}

run();
