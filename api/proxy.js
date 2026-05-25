export default async function handler(req, res) {
  // Allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-client-info, prefer');

  // Handle preflight
  if(req.method === 'OPTIONS'){
    res.status(200).end();
    return;
  }

  const SUPABASE_URL = 'https://qpdkzokhebhipxwcpvle.supabase.co';
  const ANON_KEY = process.env.SUPABASE_ANON_KEY;

  // Build the target Supabase URL
  const path = req.url.replace('/api/proxy', '');
  const target = `${SUPABASE_URL}${path}`;

  try {
    const response = await fetch(target, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': req.headers.authorization || `Bearer ${ANON_KEY}`,
        'x-client-info': req.headers['x-client-info'] || '',
        'prefer': req.headers['prefer'] || ''
      },
      body: req.method !== 'GET' && req.method !== 'HEAD'
        ? JSON.stringify(req.body)
        : undefined
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); }
    catch { data = text; }

    res.status(response.status).json(data);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
}
