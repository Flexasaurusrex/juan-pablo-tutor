export default async function handler(req, res) {
  const apiKey = process.env.HEYGEN_API_KEY;
  const avatarId = process.env.AVATAR_ID;

  console.log('Testing HeyGen API...');
  console.log('API Key (first 10 chars):', apiKey?.substring(0, 10) + '...');
  console.log('Avatar ID:', avatarId);

  try {
    // Test 1: Check if API key works by listing avatars
    console.log('=== TEST 1: List Avatars ===');
    const listResponse = await fetch('https://api.heygen.com/v2/avatars', {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
    });

    const listText = await listResponse.text();
    console.log('List avatars response:', listResponse.status, listText);

    let listData = null;
    try {
      listData = JSON.parse(listText);
    } catch (e) {
      console.log('Could not parse list response as JSON');
    }

    // Test 2: Try the Interactive Avatar API with different approach
    console.log('=== TEST 2: Interactive Avatar API ===');
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const interactiveResponse = await fetch('https://api.heygen.com/v1/streaming.start', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        avatar_id: avatarId,
        quality: 'medium'
      }),
    });

    const interactiveText = await interactiveResponse.text();
    console.log('Interactive response:', interactiveResponse.status, interactiveText);

    // Test 3: Try minimal payload
    console.log('=== TEST 3: Minimal Payload ===');
    
    const minimalSessionId = `test_${Date.now()}`;
    
    const minimalResponse = await fetch('https://api.heygen.com/v1/streaming.start', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: minimalSessionId,
        avatar_id: avatarId
      }),
    });

    const minimalText = await minimalResponse.text();
    console.log('Minimal response:', minimalResponse.status, minimalText);

    // Return all results
    return res.status(200).json({
      test_results: {
        api_key_format: apiKey ? 'present' : 'missing',
        avatar_id: avatarId,
        list_avatars: {
          status: listResponse.status,
          response: listText,
          parsed: listData
        },
        interactive_avatar: {
          status: interactiveResponse.status,
          response: interactiveText,
          session_id: sessionId
        },
        minimal_payload: {
          status: minimalResponse.status,
          response: minimalText,
          session_id: minimalSessionId
        }
      }
    });

  } catch (error) {
    console.error('Test error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}
