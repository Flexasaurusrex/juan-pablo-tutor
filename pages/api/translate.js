export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Text is required' });
  }

  // Use Together.ai API for translation
  const togetherApiKey = process.env.TOGETHER_API_KEY;

  if (!togetherApiKey) {
    return res.status(500).json({ message: 'Translation service not configured' });
  }

  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${togetherApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional English to Spanish translator. Translate the given English text to natural, conversational Mexican Spanish. Only respond with the Spanish translation, nothing else.'
          },
          {
            role: 'user',
            content: `Translate this English text to Mexican Spanish: "${text}"`
          }
        ],
        max_tokens: 512,
        temperature: 0.3,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Together API error: ${response.status}`);
    }

    const data = await response.json();
    const translation = data.choices?.[0]?.message?.content?.trim();

    if (!translation) {
      throw new Error('No translation received');
    }

    return res.status(200).json({
      translation: translation,
      original: text
    });

  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({ 
      message: 'Translation failed',
      error: error.message 
    });
  }
}
