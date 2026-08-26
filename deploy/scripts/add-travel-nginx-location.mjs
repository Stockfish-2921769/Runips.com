#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  console.error('Usage: add-travel-nginx-location.mjs <input> <output>');
  process.exit(2);
}

const source = await readFile(inputPath, 'utf8');
const searchLocation = '    location = /api/travel/v1/search {';

if (source.includes(searchLocation)) {
  await writeFile(outputPath, source, { mode: 0o644 });
  process.exit(0);
}

const marker = `    location / {
        try_files $uri $uri.html $uri/ =404;
    }`;

const proxyLocations = `    location = /api/travel/v1/search {
        client_max_body_size 8k;
        proxy_pass http://127.0.0.1:18010/v1/search;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    location = /api/travel/v1/health {
        proxy_pass http://127.0.0.1:18010/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Connection "";
        proxy_connect_timeout 2s;
        proxy_read_timeout 5s;
    }

`;

const markerIndex = source.indexOf(marker);
if (markerIndex === -1) {
  console.error('The expected frontend location marker was not found; no file was written.');
  process.exit(1);
}

const rendered = `${source.slice(0, markerIndex)}${proxyLocations}${source.slice(markerIndex)}`;
await writeFile(outputPath, rendered, { mode: 0o644 });
