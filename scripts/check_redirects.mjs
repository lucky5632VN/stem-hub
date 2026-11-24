import fs from 'fs';

const redirects = [
  'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGU-EJUaogYx_hC3t5QJ42aaPGl3hI636jNazE7Jix4gbY8qeHI-HzQdYuGpxXYoCh5hxzj_QXbV4WfInxKScNxfhCQ3fIkU9_Sn1fP0PWvFkF4DMc7LqCgOmd3WzE-L8ZXZA0Tb47cvJ6v05V8Es2thgVifQgDLR1YjZs2r6Ju9duzOanCpvA=',
  'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEMSZlyNN5vBKH24rD5P6D7jMBExG3ATz3oqmweJk-KnfP90eNsB2oU4hWugkqqc2Hf3J7UAg6UcldEv4G-TSxm4TOfxWNok9BKQJdYLFWiiD_9xQ_JaZHEGrAdPOt6Z27rmDKK2C6M26ziY02F_jmHP3SE86vTw1cwgqB8L4EsqR-r1DGEfZo='
];

async function checkRedirects() {
  for (const r of redirects) {
    try {
      const res = await fetch(r, { method: 'HEAD', redirect: 'follow' });
      console.log('Redirect ->', res.url);
    } catch(e) {
      console.error(e.message);
    }
  }
}

checkRedirects().catch(console.error);

