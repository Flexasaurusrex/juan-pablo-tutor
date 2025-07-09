export default async function handler(req, res) {
  const rawApiKey = process.env.HEYGEN_API_KEY;
  
  // Your key looks base64 encoded, let's try decoding it
  let decodedKey = '';
  try {
    decodedKey = Buffer.from(rawApiKey, 'base64').toString('utf-8');
  } catch (e) {
    decodedKey = 'decode_failed';
  }

  console.log('Raw API Key:', rawApiKey);
  console.log('Decoded API Key:', decodedKey);

  try {
    // Test with raw key
    const rawResponse = await fetch('https://api.heygen.com/v2/avatars', {
      method: 'GET',
      headers: {
        'X-API-KEY': rawApiKey,
        'Content-Type': 'application/json',
      },
    });

    const rawText = await rawResponse.text();

    // Test with decoded key
    const decodedResponse = await fetch('https://api.heygen.com/v2/avatars', {
      method: 'GET',
      headers: {
        'X-API-KEY': decodedKey,
        'Content-Type': 'application/json',
      },
    });

    const decodedText = await decodedResponse.text();

    return res.status(200).json({
      raw_key_test: {
        status: rawResponse.status,
        response: rawText.substring(0, 500) // First 500 chars
      },
      decoded_key_test: {
        status: decodedResponse.status,
        response: decodedText.substring(0, 500) // First 500 chars
      },
      key_info: {
        raw_length: rawApiKey?.length,
        decoded_length: decodedKey?.length,
        looks_base64: rawApiKey?.includes('=='),
        decoded_preview: decodedKey?.substring(0, 20)
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message,
      raw_api_key_length: rawApiKey?.length,
      decoded_key_preview: decodedKey?.substring(0, 20)
    });
  }
}
