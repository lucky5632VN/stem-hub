const url = 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFw8fhdtpsKQZR7B58Y9wSV3whPGSW20APYIEwP9UrhuDDWw0euZGBlrHmQrRtQqIrquKSOvFAEPoX1eguYCEnuWr8itMQgvLJM45t0LcOdQr6KUB6AbRzN9bXazR5iitn1fBDmtcopv3I1bb1hUzu6qBlglvdZdtR9QqKjOLOgcYpiiQI2prIAjQ==';

async function check() {
  const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
  console.log('Bio redirect ->', res.url);
}
check();

