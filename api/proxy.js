export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-client-info, prefer, x-supabase-api-version');

  if(req.method === 'OPTIONS'){
    res.status(200).end();
    return;
  }

  const SUPABASE_URL = 'https://qpdkzokhebhipxwcpvle.supabase.co';
  const ANON_KEY = process.env.SUPABASE_ANON_KEY;

  // Get the path after /api/proxy
  const fullUrl = req.url;
  const path = fullUrl.replace(/^\/api\/proxy/, '');
  const target = `${SUPABASE_URL}${path}`;

  try {
    // Forward all headers from client
    const forwardHeaders = {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': req.headers['authorization'] || `Bearer ${ANON_KEY}`,
    };

    // Forward optional headers if present
    if(req.headers['x-client-info']) forwardHeaders['x-client-info'] = req.headers['x-client-info'];
    if(req.headers['prefer']) forwardHeaders['prefer'] = req.headers['prefer'];
    if(req.headers['x-supabase-api-version']) forwardHeaders['x-supabase-api-version'] = req.headers['x-supabase-api-version'];

    const fetchOptions = {
      method: req.method,
      headers: forwardHeaders,
    };

    // Only add body for non-GET requests
    if(req.method !== 'GET' && req.method !== 'HEAD'){
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(target, fetchOptions);
    const text = await response.text();

    // Forward all response headers from Supabase
    response.headers.forEach((value, key) => {
      // Skip headers that cause issues
      if(!['content-encoding','transfer-encoding','connection'].includes(key)){
        res.setHeader(key, value);
      }
    });

    res.status(response.status).send(text);

  } catch(err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
}
