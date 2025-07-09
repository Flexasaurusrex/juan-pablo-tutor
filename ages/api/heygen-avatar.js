export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { action, heygenApiKey, avatarId, text } = req.body;

  if (!action || !heygenApiKey) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    if (action === 'start_session') {
      if (!avatarId) {
        return res.status(400).json({ error: 'Avatar ID required for starting session' });
      }

      // Start HeyGen Interactive Avatar session
      const response = await fetch('https://api.heygen.com/v1/streaming.start', {
        method: 'POST',
        headers: {
          'X-API-KEY': heygenApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar_id: avatarId,
          quality: 'high',
          voice: {
            language: 'es',
            gender: 'male',
            speed: 1.0
          },
          video_encoding: 'H264'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HeyGen start session error:', response.status, errorText);
        return res.status(response.status).json({ 
          error: `Failed to start HeyGen session: ${response.status}`,
          details: errorText
        });
      }

      const data = await response.json();
      console.log('HeyGen session started:', data);
      res.status(200).json({ ...data, success: true });

    } else if (action === 'speak') {
      if (!text) {
        return res.status(400).json({ error: 'Text required for speaking' });
      }

      // Make avatar speak
      const response = await fetch('https://api.heygen.com/v1/streaming.task', {
        method: 'POST',
        headers: {
          'X-API-KEY': heygenApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          task_type: 'talk',
          voice_settings: {
            speed: 1.0,
            emotion: 'friendly'
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HeyGen speak error:', response.status, errorText);
        return res.status(response.status).json({ 
          error: `Failed to make avatar speak: ${response.status}`,
          details: errorText
        });
      }

      const data = await response.json();
      res.status(200).json({ ...data, success: true });

    } else if (action === 'stop_session') {
      // Stop session
      const response = await fetch('https://api.heygen.com/v1/streaming.stop', {
        method: 'POST',
        headers: {
          'X-API-KEY': heygenApiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HeyGen stop session error:', response.status, errorText);
        return res.status(response.status).json({ 
          error: `Failed to stop HeyGen session: ${response.status}`,
          details: errorText
        });
      }

      const data = await response.json();
      res.status(200).json({ ...data, success: true });

    } else {
      return res.status(400).json({ error: 'Invalid action. Use: start_session, speak, or stop_session' });
    }

  } catch (error) {
    console.error('HeyGen API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: 'Check if your HeyGen API key and Avatar ID are correct'
    });
  }
}
