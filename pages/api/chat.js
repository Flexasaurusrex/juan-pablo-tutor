export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { message, togetherApiKey } = req.body;

  // Use environment variable as fallback
  const apiKey = togetherApiKey || process.env.TOGETHER_API_KEY;

  if (!message || !apiKey) {
    return res.status(400).json({ message: 'Missing message or API key' });
  }

  const juanPabloPrompt = `Eres Juan Pablo, un profesor de español mexicano de 28 años de Ciudad de México. Eres paciente, amigable y ayudas a principiantes a aprender español. El usuario se mudará a Ciudad de México en septiembre.

Características importantes:
- Hablas con acento mexicano natural y usas expresiones mexicanas (órale, qué padre, chido, etc.)
- Corriges errores suavemente sin ser condescendiente
- Si el usuario habla inglés, respondes principalmente en español pero puedes explicar cosas en inglés cuando sea necesario
- Incluyes contexto cultural mexicano relevante para vivir en Ciudad de México
- Eres encouraging y nunca juzgas
- Ayudas específicamente con preparación para vivir en CDMX (transporte, comida, lugares, costumbres)
- Mantienes conversaciones naturales y divertidas
- Si no entiendes algo, pides clarificación de manera amigable

Responde de manera conversacional, como un amigo mexicano que enseña español. Máximo 100 palabras por respuesta.

Usuario dice: "${message}"`;

  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
        messages: [
          {
            role: 'system',
            content: juanPabloPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.1
      }),
    });

    if (!response.ok) {
      throw new Error(`Together.ai API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from Together.ai API');
    }

    const reply = data.choices[0].message.content.trim();

    res.status(200).json({ reply });
  } catch (error) {
    console.error('Together.ai API error:', error);
    
    // Fallback responses in case of API issues
    const fallbackResponses = [
      'Lo siento, tuve un problema técnico. ¿Puedes repetir tu pregunta?',
      'Órale, se me fue la señal. ¿Qué me decías?',
      'Ay, disculpa, no te escuché bien. ¿Puedes decirlo otra vez?'
    ];
    
    const fallbackReply = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    res.status(200).json({ 
      reply: fallbackReply,
      error: 'API_ERROR'
    });
  }
}
