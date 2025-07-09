export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { action, heygenApiKey, avatarId, text, sessionId } = req.body;

  // Use environment variables as fallback
  const apiKey = heygenApiKey || process.env.HEYGEN_API_KEY;
  const avatar = avatarId || process.env.AVATAR_ID;

  console.log('=== HEYGEN API CALL ===');
  console.log('Action:', action);
  console.log('Avatar ID:', avatar);
  console.log('Session ID:', sessionId);
  console.log('======================');

  if (!action || !apiKey) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    if (action === 'start_session') {
      if (!avatar) {
        return res.status(400).json({ error: 'Avatar ID required for starting session' });
      }

      // Generate a unique session ID
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('Starting HeyGen session with ID:', newSessionId);

      const response = await fetch('https://api.heygen.com/v1/streaming.start', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: newSessionId,
          avatar_id: avatar,
          quality: 'high',
          voice: {
            language: 'es',
            gender: 'male',
            speed: 1.0
          },
          video_encoding: 'H264'
        }),
      });

      const responseText = await response.text();
      console.log('HeyGen response:', response.status, responseText);

      if (!response.ok) {
        console.error('HeyGen start session error:', response.status, responseText);
        return res.status(response.status).json({ 
          error: `Failed to start HeyGen session: ${response.status}`,
          details: responseText
        });
      }

      const data = JSON.parse(responseText);
      console.log('✅ HeyGen session started successfully:', data);
      
      // Store session ID for later use
      return res.status(200).json({ 
        ...data, 
        success: true,
        session_id: newSessionId
      });

    } else if (action === 'speak') {
      if (!text) {
        return res.status(400).json({ error: 'Text required for speaking' });
      }

      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required for speaking' });
      }

      console.log('Making avatar speak:', text, 'in session:', sessionId);

      const response = await fetch('https://api.heygen.com/v1/streaming.task', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          text: text,
          task_type: 'talk',
          voice_settings: {
            speed: 1.0,
            emotion: 'friendly'
          }
        }),
      });

      const responseText = await response.text();
      console.log('Speak API response:', response.status, responseText);

      if (!response.ok) {
        return res.status(response.status).json({ 
          error: `Failed to make avatar speak: ${response.status}`,
          details: responseText
        });
      }

      const data = JSON.parse(responseText);
      return res.status(200).json({ ...data, success: true });

    } else if (action === 'stop_session') {
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID required for stopping session' });
      }

      console.log('Stopping session:', sessionId);

      const response = await fetch('https://api.heygen.com/v1/streaming.stop', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId
        }),
      });

      const responseText = await response.text();
      console.log('Stop API response:', response.status, responseText);

      if (!response.ok) {
        return res.status(response.status).json({ 
          error: `Failed to stop HeyGen session: ${response.status}`,
          details: responseText
        });
      }

      const data = JSON.parse(responseText);
      return res.status(200).json({ ...data, success: true });

    } else {
      return res.status(400).json({ error: 'Invalid action. Use: start_session, speak, or stop_session' });
    }

  } catch (error) {
    console.error('❌ HeyGen API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}
