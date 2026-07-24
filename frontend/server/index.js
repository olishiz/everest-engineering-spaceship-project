const indexRequest = (request) => {
  const url = new URL(request.url);
  url.pathname = '/index.html';
  return new Request(url, request);
};

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || request.method !== 'GET') return response;

    return env.ASSETS.fetch(indexRequest(request));
  },
};
