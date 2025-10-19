/**
 * Vercel Serverless Function: Geocoding API Proxy
 * Compatible with Netlify Function API
 * Proxies geocoding requests to Nominatim API
 * No API key required, but respects usage limits
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({ 
        error: 'Missing address parameter'
      });
    }

    console.log(`[Vercel] Geocoding request for: ${address}`);

    // Call Nominatim API
    const nominatimUrl = `https://nominatim.openstreetmap.org/search`;
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      addressdetails: '1'
    });

    const response = await fetch(`${nominatimUrl}?${params}`, {
      headers: {
        'User-Agent': 'WLO-Metadata-Canvas/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Vercel] Nominatim API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Geocoding API error',
        status: response.status,
        message: errorText
      });
    }

    const data = await response.json();
    
    // Transform to expected format
    if (data && data.length > 0) {
      const result = data[0];
      return res.status(200).json({
        lat: result.lat,
        lon: result.lon,
        display_name: result.display_name,
        address: result.address
      });
    } else {
      return res.status(404).json({
        error: 'No results found',
        message: 'Could not geocode the provided address'
      });
    }

  } catch (error) {
    console.error('[Vercel] Function error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}
