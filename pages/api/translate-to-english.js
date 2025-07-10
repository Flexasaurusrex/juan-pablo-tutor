// pages/api/translate-to-english.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { spanishText, togetherApiKey } = req.body;
  
  // Use environment variable as fallback
  const apiKey = togetherApiKey || process.env.TOGETHER_API_KEY;

  if (!spanishText || !apiKey) {
    return res.status(400).json({ message: 'Missing Spanish text or API key' });
  }

  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        messages: [
          {
            role: 'system',
            content: `You are a professional Spanish-to-English translator specializing in Mexican Spanish. Your job is to translate Mexican Spanish text to natural, clear English.

INSTRUCTIONS:
- Translate Mexican Spanish to natural English
- Preserve the tone and meaning (formal, casual, enthusiastic, etc.)
- Keep Mexican cultural references and explain them when helpful
- If there are Mexican slang terms, translate them and briefly explain
- Maintain any emojis and formatting
- Make the English sound natural, not robotic

EXAMPLES:
Spanish: "¡Órale! ¿Qué tal?" 
English: "Wow! How's it going?" (Órale = Mexican expression of surprise/excitement)

Spanish: "¿A qué hora es la junta?"
English: "What time is the meeting?" (Junta = meeting in Mexican Spanish)

Respond ONLY with the English translation. Be natural and clear.`
          },
          {
            role: 'user',
            content: `Translate this Mexican Spanish to English: "${spanishText}"`
          }
        ],
        max_tokens: 300,
        temperature: 0.3,
        top_p: 0.9,
        repetition_penalty: 1,
        stream: false
      })
    });

    if (!response.ok) {
      console.error('Together API error:', response.status, response.statusText);
      throw new Error(`Together API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return res.status(200).json({ 
        translation: data.choices[0].message.content.trim() 
      });
    } else {
      throw new Error('Invalid response format from Together API');
    }

  } catch (error) {
    console.error('Translation API error:', error);
    
    // Smart fallback translations for common phrases
    const fallbackTranslations = getFallbackTranslation(spanishText);
    
    return res.status(200).json({ 
      translation: fallbackTranslations || 'Translation temporarily unavailable - please try again',
      error: error.message 
    });
  }
}

// Fallback translations for common Juan Pablo responses
function getFallbackTranslation(spanishText) {
  const text = spanishText.toLowerCase();
  
  if (text.includes('hola') && text.includes('juan pablo')) {
    return "Hello! I'm Juan Pablo, your Mexican Spanish teacher. I'm super excited to help you prepare for your move to Mexico City in September. I can help you with: • Grammar and pronunciation corrections • Useful phrases for daily life in CDMX • Mexican expressions and culture • Real situations (transport, food, work). What would you like to start practicing today? You can write in English or Spanish - I'll help you!";
  }
  
  if (text.includes('órale') || text.includes('qué padre')) {
    return "Wow! That's awesome! (Mexican expressions of excitement/approval)";
  }
  
  if (text.includes('taco') && text.includes('pedir')) {
    return "How to order tacos? Perfect! To order tacos in CDMX like an authentic local: Basic: 'I want three pastor tacos, please' Casual: 'Give me two carnitas and one suadero' Question: 'What types of meat do you have?' / 'What do you recommend?' Key phrases: • 'With everything?' = with salsa, onion, cilantro • 'Is it spicy?' • 'No cilantro, please' Would you like to practice ordering different types of Mexican tacos?";
  }
  
  if (text.includes('metro') || text.includes('transporte')) {
    return "How to use transportation in CDMX? Transportation in Mexico City is super easy when you know what to say! Metro: • 'Where is the Metro station?' • 'What line goes to [Polanco/Roma Norte/Centro]?' • 'What station do I get off at?' Bus/Metrobus: • 'Does this bus go to...?' • 'I get off at the next stop' Costs: Metro $5 pesos, Metrobus $6 pesos. Do you want to practice asking for specific directions in CDMX?";
  }
  
  if (text.includes('problema técnico')) {
    return "Hello! I had a technical problem. Can you repeat your question? I'm here to help you practice Spanish.";
  }
  
  return null; // No fallback available
}
