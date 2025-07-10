// pages/api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { message, conversationHistory = [], togetherApiKey } = req.body;
  
  // Use environment variable as fallback
  const apiKey = togetherApiKey || process.env.TOGETHER_API_KEY;
  
  if (!message || !apiKey) {
    return res.status(400).json({ message: 'Missing message or API key' });
  }

  try {
    // Advanced system prompt for Juan Pablo
    const systemPrompt = `Eres Juan Pablo, un profesor de español mexicano de 28 años de Ciudad de México. Eres el mejor tutor de español que existe, especializado en preparar estadounidenses para vivir en CDMX.

PERSONALIDAD Y ESTILO:
- Eres súper amigable, paciente y motivador 😊
- Usas emojis para hacer la conversación divertida
- Hablas con acento mexicano natural (órale, qué padre, chido, etc.)
- Celebras cada progreso del estudiante
- Nunca juzgas errores - los corriges constructivamente
- Eres experto en la cultura de Ciudad de México

TUS SUPERPODERES COMO TUTOR:
1. 🎯 CORRECCIÓN INTELIGENTE: Si el estudiante comete errores en español, corrígelos así:
   "✏️ Corrección: [versión correcta] - [explicación breve]"
   
2. 🔄 TRADUCCIÓN BIDIRECCIONAL: Si escribe en inglés, responde:
   "🔄 En español: [traducción] - [contexto cultural si aplica]"
   
3. 📚 ENSEÑANZA PROGRESIVA: 
   - Evalúa el nivel del estudiante
   - Introduce nuevas palabras gradualmente
   - Repite vocabulario importante
   
4. 🇲🇽 ESPECIALISTA EN CDMX: Enseña específicamente sobre:
   - Transporte (Metro, Metrobús, Uber, combis)
   - Comida auténtica mexicana y dónde encontrarla
   - Barrios seguros y recomendados (Roma Norte, Condesa, Polanco)
   - Expresiones chilangnas (de CDMX)
   - Situaciones de emergencia y salud
   - Trabajo y oficinas en México
   - Vida social y costumbres mexicanas
   
5. 💪 PRÁCTICA ACTIVA: Siempre termina con:
   - Una pregunta para continuar la conversación
   - Un ejercicio práctico
   - Una frase nueva para memorizar
   - Una situación real para practicar

ESTRUCTURA DE TUS RESPUESTAS:
- Responde principalmente en español (ajustado al nivel del estudiante)
- Incluye contexto cultural cuando sea relevante
- Da ejemplos prácticos para CDMX
- Propón ejercicios específicos
- Mantén un tono conversacional y natural

NIVELES DE ESPAÑOL:
- Principiante: Frases básicas, mucha traducción
- Intermedio: Conversación mixta, correcciones frecuentes
- Avanzado: Español completo, modismos mexicanos

SITUACIONES PRIORITARIAS PARA CDMX:
🚇 Transporte: "¿Dónde está la estación del Metro?" "¿Cuánto cuesta el boleto?"
🌮 Comida: "¿Qué me recomienda?" "¿Está muy picante?"
🏠 Vivienda: "¿Cuánto cuesta el alquiler?" "¿Incluye servicios?"
💼 Trabajo: "¿A qué hora es la junta?" "¿Podrías ayudarme?"
🆘 Emergencias: "Necesito ayuda" "¿Dónde está el hospital?"
💰 Compras: "¿Cuánto cuesta?" "¿Hay descuento?"

¡Sé el mejor profesor de español que el estudiante haya tenido! Haz que cada respuesta sea útil, divertida y práctica para su vida en México. 🇲🇽✨`;

    // Build conversation context
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // Add conversation history (last 6 exchanges to maintain context)
    if (conversationHistory.length > 0) {
      conversationHistory.slice(-12).forEach(msg => {
        messages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        });
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    console.log('🚀 Advanced Juan Pablo API - Sending to Together.ai:', {
      messageCount: messages.length,
      currentMessage: message,
      hasHistory: conversationHistory.length > 0,
      apiKeyPresent: !!apiKey
    });

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', // Using your powerful model
        messages: messages,
        max_tokens: 600, // More space for detailed explanations
        temperature: 0.8, // Creative but consistent
        top_p: 0.9,
        repetition_penalty: 1.1,
        stream: false
      }),
    });

    console.log('📡 Together.ai response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Together.ai error:', response.status, errorText);
      
      // Smart fallback based on user input
      const smartFallback = getSmartFallback(message);
      return res.status(200).json({ 
        response: smartFallback,
        error: `API_ERROR_${response.status}`
      });
    }

    const data = await response.json();
    console.log('📝 Together.ai response received');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from Together.ai API');
    }

    const juanPabloResponse = data.choices[0].message.content.trim();
    console.log('✅ Juan Pablo says:', juanPabloResponse.substring(0, 100) + '...');
    
    return res.status(200).json({ 
      response: juanPabloResponse,
      conversationLength: messages.length
    });

  } catch (error) {
    console.error('❌ Advanced Chat API error:', error);
    
    // Smart fallback system
    const smartFallback = getSmartFallback(message);
    
    return res.status(200).json({ 
      response: smartFallback,
      error: error.message 
    });
  }
}

// Smart fallback system for when API fails
function getSmartFallback(message) {
  const lowerMessage = message.toLowerCase();
  
  // Food & Restaurant fallbacks
  if (lowerMessage.includes('taco') || lowerMessage.includes('food') || lowerMessage.includes('order') || lowerMessage.includes('restaurant')) {
    return `🔄 En español: ¿Cómo pido tacos?

¡Órale! Para pedir tacos en CDMX como un chilango auténtico:

🌮 **Básico:** "Quiero tres tacos de pastor, por favor"
🌮 **Casual:** "Me da dos de carnitas y uno de suadero"
🌮 **Pregunta:** "¿Qué carnes tienen?" / "¿Cuál me recomienda?"

**Frases clave:**
• "¿Con todo?" = with salsa, onion, cilantro
• "¿Está picante?" = Is it spicy?
• "Sin cilantro, por favor" = No cilantro please

¿Te gustaría practicar ordenando diferentes tipos de tacos mexicanos? 🇲🇽`;
  }
  
  // Transportation fallbacks
  if (lowerMessage.includes('metro') || lowerMessage.includes('transport') || lowerMessage.includes('travel') || lowerMessage.includes('direction')) {
    return `🔄 En español: ¿Cómo usar el transporte en CDMX?

¡El transporte en Ciudad de México es súper fácil cuando sabes qué decir!

🚇 **Metro:**
• "¿Dónde está la estación del Metro?"
• "¿Qué línea va a [Polanco/Roma Norte/Centro]?"
• "¿En qué estación me bajo?"

🚌 **Autobús/Metrobús:**
• "¿Este camión va a...?"
• "Me bajo en la siguiente" = I get off at the next stop

💰 **Costos:** Metro $5 pesos, Metrobús $6 pesos

¿Quieres practicar pidiendo direcciones específicas en CDMX? 🗺️`;
  }
  
  // Greetings fallbacks
  if (lowerMessage.includes('hello') || lowerMessage.includes('hola') || lowerMessage.includes('greet') || lowerMessage.includes('hi')) {
    return `🔄 En español: Saludos mexicanos auténticos

¡Qué padre! Aprende a saludar como chilango:

👋 **Formal:**
• "¡Hola! ¿Cómo está usted?" (older people/formal)
• "Buenos días/tardes/noches"

👋 **Casual (Mexican style):**
• "¡Órale! ¿Qué tal?" (What's up - very Mexican!)
• "¿Cómo andas?" (How are you doing?)
• "¿Qué onda?" (What's up - casual)

👋 **Despedidas:**
• "¡Que tengas buen día!"
• "¡Nos vemos!" (See you later)

¿Quieres practicar una conversación completa con saludos mexicanos? 😊`;
  }
  
  // Work/Professional fallbacks
  if (lowerMessage.includes('work') || lowerMessage.includes('job') || lowerMessage.includes('office') || lowerMessage.includes('professional')) {
    return `🔄 En español: Vocabulario profesional para CDMX

¡Perfecto para tu trabajo en México!

💼 **Frases esenciales:**
• "¿Dónde está la oficina de...?"
• "¿A qué hora es la junta?" (meeting)
• "¿Podrías ayudarme con esto?"
• "Voy a trabajar desde casa" (WFH)

💼 **Vocabulario clave:**
• Junta = Meeting
• Jefe/Jefa = Boss
• Compañero = Colleague
• Proyecto = Project

💼 **Cortesía mexicana:**
• "¿Me permite?" = Excuse me/May I?
• "Con permiso" = Excuse me (passing by)

¿Te gustaría practicar una conversación de oficina completa? 🏢`;
  }
  
  // Emergency fallbacks
  if (lowerMessage.includes('help') || lowerMessage.includes('emergency') || lowerMessage.includes('hospital') || lowerMessage.includes('problem')) {
    return `🔄 En español: Frases de emergencia para CDMX

¡Importante! Frases que pueden salvarte:

🆘 **Emergencias:**
• "¡Ayuda!" / "¡Auxilio!" = Help!
• "Necesito ayuda" = I need help
• "Llame a la policía" = Call the police

🏥 **Salud:**
• "¿Dónde está el hospital?"
• "Me siento mal" = I feel sick
• "Necesito un doctor"

📞 **Números importantes:**
• 911 = Emergencias
• Cruz Roja = Red Cross

¿Quieres practicar más situaciones de emergencia? 🚨`;
  }
  
  // Default friendly fallback
  const mexicanFallbacks = [
    `¡Órale! 👋 Disculpa, tuve un problema técnico. ¿Puedes repetir tu pregunta? Estoy aquí para ayudarte a prepararte para CDMX como un auténtico chilango. 🇲🇽

¿Te gustaría practicar:
• 🌮 Pedir comida mexicana
• 🚇 Usar el transporte público  
• 💬 Conversaciones básicas
• 🏢 Vocabulario de trabajo?`,

    `¡Qué padre que estés aquí! 😊 Se me fue la señal un momentito, pero ya regresé. 

¿En qué te puedo ayudar para tu mudanza a Ciudad de México? Podemos practicar:
• Expresiones chilangnas auténticas
• Situaciones reales de la vida en CDMX
• ¡Lo que tú quieras! 🇲🇽`,

    `¡Ay, disculpa! 🤖 Tuve un pequeño problema, pero aquí ando otra vez.

Como buen mexicano, ¡nunca me rindo! ¿Qué te gustaría aprender sobre la vida en Ciudad de México? ¡Estoy súper emocionado de ayudarte! 🌟`
  ];
  
  return mexicanFallbacks[Math.floor(Math.random() * mexicanFallbacks.length)];
}
