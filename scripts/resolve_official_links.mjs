const urls = [
  'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQG9g3VVvcv6eOodRci3w0Bcgk5azfXKrggkpUZD4bDI4lWXmpDhHDk61vU8SwtUyWlHA_5QP2XHImf0XvtkibxNws9ZhOLNW4kKPfUcmQm6NOp5-1_QUp5dHNlXipnoIcjbGyMwQGczCqKy7AMKFxiSslJndfGn1FXWArZpoHqcCacVdVSzYGSGnhTVyQXt8UF1nT1dowOpAR12qaf8_Hc3cfsroEv9SR8VpRA=',
  'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEtYKBIWZ_3bK3KGiosqe8rbEIqmGY4ut74LC40hyqVhmOTvdH4vx2Gy0Vnkon6cO2t-iO-b8vA8m0ceXg8GrDNeCrFNwoOcatJeATDsesYysJDKlPVn9uWA5Ayv3CnMVUv_ZOTuCiu83BC35QSJbC5EduZXPFHpCmSd1ZkOYN76GAAsw6POSKG7SAlfpDbp4WFzc-Tjm0Uy20CLBQ='
];

async function check() {
  for (const u of urls) {
    try {
      const res = await fetch(u, { method: 'HEAD', redirect: 'follow' });
      console.log('Redirect:', res.url);
    } catch(e) {
      console.error(e.message);
    }
  }
}
check();

