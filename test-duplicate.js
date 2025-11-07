#!/usr/bin/env node
require('dotenv').config();

const username = process.env.WLO_GUEST_USERNAME;
const password = process.env.WLO_GUEST_PASSWORD;
const baseUrl = process.env.WLO_REPOSITORY_BASE_URL || 'https://repository.staging.openeduhub.net/edu-sharing';
const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

const urlToCheck = process.argv[2] || 'https://example.com';

(async () => {
  const searchUrl = `${baseUrl}/rest/search/v1/queries/-home-/mds_oeh/ngsearch?contentType=FILES&maxItems=10&skipCount=0&propertyFilter=ccm:wwwurl`;
  const body = JSON.stringify({
    criteria: [{ property: 'ccm:wwwurl', values: [urlToCheck] }]
  });
  const response = await fetch(searchUrl, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body
  });
  console.log('Status', response.status);
  const text = await response.text();
  console.log(text);
})();
