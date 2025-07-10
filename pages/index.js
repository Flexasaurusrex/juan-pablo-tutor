import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function JuanPablo() {
  const [currentMode, setCurrentMode] = useState(null);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageTranslations, setMessageTranslations] = useState({});
  const [translatingMessageId, setTranslatingMessageId] = useState(null);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);

  // Learning Game States
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [gameMode, setGameMode] = useState(null); // 'multiple', 'fillblank'
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [streak, setStreak] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState([]);

  // CDMX Learning Questions
  const multipleChoiceQuestions = [
    {
      question: "¿Cómo se dice 'subway' en México?",
      options: ["Metro", "Subte", "Tren", "Túnel"],
      correct: 0,
      explanation: "En México City usamos 'Metro' - ¡igual que en París!"
    },
    {
      question: "¿Cuál es la forma correcta de pedir tacos?",
      options: ["Quiero tacos", "Dame tacos", "Quisiera tacos", "Necesito tacos"],
      correct: 2,
      explanation: "'Quisiera' es más educado en México - ¡perfecto para tu primera vez!"
    },
    {
      question: "¿Cómo saludas en CDMX por la mañana?",
      options: ["¡Hola!", "¡Buenos días!", "¡Buenas!", "¡Órale!"],
      correct: 1,
      explanation: "'¡Buenos días!' es perfecto hasta las 12pm en México"
    },
    {
      question: "¿Qué significa 'chilango'?",
      options: ["Comida picante", "Persona de CDMX", "Metro rápido", "Dinero mexicano"],
      correct: 1,
      explanation: "¡Exacto! Los chilangos son las personas de Ciudad de México"
    },
    {
      question: "¿Cómo pides direcciones en español?",
      options: ["¿Dónde queda...?", "¿Cuánto cuesta...?", "¿Qué hora es?", "¿Cómo te llamas?"],
      correct: 0,
      explanation: "'¿Dónde queda...?' es perfecto para preguntar ubicaciones"
    }
  ];

  const fillBlankQuestions = [
    {
      question: "Para comprar en el Metro: 'Quisiera una _____ del Metro, por favor'",
      answer: "tarjeta",
      hint: "Es lo que necesitas para viajar en transporte público",
      explanation: "¡Perfecto! Una 'tarjeta' del Metro te permite viajar por toda CDMX"
    },
    {
      question: "En un restaurante: '¿Me puede traer la _____, por favor?'",
      answer: "cuenta",
      hint: "Lo que pides cuando terminas de comer",
      explanation: "¡Exacto! 'La cuenta' es como pides el check en México"
    },
    {
      question: "Saludando a un colega: '¡Hola! ¿Cómo _____?'",
      answer: "estás",
      hint: "Pregunta común para saludar",
      explanation: "¡Bien! '¿Cómo estás?' es el saludo perfecto para colegas"
    },
    {
      question: "En el trabajo: 'Tengo una _____ a las 3pm'",
      answer: "junta",
      hint: "En México no decimos 'reunión'",
      explanation: "¡Perfecto! En México decimos 'junta' en lugar de 'reunión'"
    },
    {
      question: "Comprando comida: '¿Cuánto _____ los tacos?'",
      answer: "cuestan",
      hint: "Preguntando el precio",
      explanation: "¡Excelente! '¿Cuánto cuestan?' es como preguntas precios"
    }
  ];

  // Translation functions
  const translateText = async (text) => {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await response.json();
      return data.translation || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  const translateMessage = async (messageText, messageIndex) => {
    if (messageTranslations[messageIndex]) {
      setMessageTranslations(prev => ({
        ...prev,
        [messageIndex]: null
      }));
      return;
    }

    setTranslatingMessageId(messageIndex);

    try {
      const response = await fetch('/api/translate-to-english', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spanishText: messageText })
      });

      const data = await response.json();

      if (data.translation) {
        setMessageTranslations(prev => ({
          ...prev,
          [messageIndex]: data.translation
        }));
      }
    } catch (error) {
      console.error('Translation error:', error);
      setMessageTranslations(prev => ({
        ...prev,
        [messageIndex]: 'Translation failed - try again'
      }));
    }

    setTranslatingMessageId(null);
  };

  const speakMessage = (text, messageIndex) => {
    if (speakingMessageId === messageIndex && currentAudio) {
      currentAudio.cancel();
      setCurrentAudio(null);
      setSpeakingMessageId(null);
      return;
    }

    if (currentAudio) {
      currentAudio.cancel();
    }

    const cleanText = text.replace(/[🎯🔥💪✨🚀🇲🇽📚🏆🎉👋😊💡🎊]/g, '').trim();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-MX';
    utterance.rate = 0.85;
    utterance.pitch = 1;

    const voices = speechSynthesis.getVoices();
    const mexicanVoice = voices.find(voice => 
      voice.lang.includes('es-MX') || 
      (voice.lang.includes('es') && voice.name.toLowerCase().includes('mexican'))
    );
    
    if (mexicanVoice) {
      utterance.voice = mexicanVoice;
    } else {
      const spanishVoice = voices.find(voice => voice.lang.includes('es'));
      if (spanishVoice) utterance.voice = spanishVoice;
    }

    utterance.onend = () => {
      setSpeakingMessageId(null);
      setCurrentAudio(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
      setCurrentAudio(null);
    };

    setSpeakingMessageId(messageIndex);
    setCurrentAudio(utterance);
    speechSynthesis.speak(utterance);
  };

  // Game functions
  const startGame = (mode) => {
    setGameMode(mode);
    setCurrentQuestion(0);
    setScore(0);
    setStreak(0);
    setCompletedQuestions([]);
    setShowResult(false);
    setUserAnswer('');
  };

  const handleMultipleChoice = (selectedIndex) => {
    const question = multipleChoiceQuestions[currentQuestion];
    const correct = selectedIndex === question.correct;
    
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setScore(score + 10 + (streak * 2));
      setStreak(streak + 1);
    } else {
      setStreak(0);
    }
    
    setCompletedQuestions([...completedQuestions, currentQuestion]);
  };

  const handleFillBlank = () => {
    const question = fillBlankQuestions[currentQuestion];
    const correct = userAnswer.toLowerCase().trim() === question.answer.toLowerCase();
    
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setScore(score + 15 + (streak * 3));
      setStreak(streak + 1);
    } else {
      setStreak(0);
    }
    
    setCompletedQuestions([...completedQuestions, currentQuestion]);
  };

  const nextQuestion = () => {
    setShowResult(false);
    setUserAnswer('');
    
    if (gameMode === 'multiple' && currentQuestion < multipleChoiceQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (gameMode === 'fillblank' && currentQuestion < fillBlankQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Game complete
      setGameMode('complete');
    }
  };

  const resetGame = () => {
    setGameMode(null);
    setCurrentQuestion(0);
    setScore(0);
    setStreak(0);
    setCompletedQuestions([]);
    setShowResult(false);
    setUserAnswer('');
  };

  // Chat functions
  const startChatMode = () => {
    setCurrentMode('chat');
    setMessages([
      {
        text: "¡Hola! 👋🇲🇽 Soy Juan Pablo, tu profesor de español mexicano. Estoy súper emocionado de ayudarte a prepararte para tu mudanza a Ciudad de México en septiembre.\n\n🎯 Puedo ayudarte con:\n• Correcciones de gramática y pronunciación\n• Frases útiles para la vida diaria en CDMX\n• Modismos y cultura mexicana\n• Situaciones reales (transporte, comida, trabajo)\n\n¿En qué te gustaría empezar a practicar hoy? Puedes escribir en inglés o español - ¡yo te ayudo! 😊",
        sender: 'juan-pablo',
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const newMessage = {
      text: userInput,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, newMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userInput,
          conversationHistory: messages.slice(-6)
        })
      });

      const data = await response.json();

      if (data.response || data.reply) {
        const reply = data.response || data.reply;
        setMessages(prev => [...prev, {
          text: reply,
          sender: 'juan-pablo',
          timestamp: new Date().toLocaleTimeString()
        }]);
      } else {
        setMessages(prev => [...prev, {
          text: "¡Órale! 🇲🇽 Se me trabó la conexión. ¿Puedes repetir tu pregunta? Mientras tanto, ¿sabías que en CDMX decimos 'junta' en lugar de 'reunión'? 😊",
          sender: 'juan-pablo',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        text: "Lo siento, tuve un problema técnico. ¿Puedes repetir tu pregunta? 🤔",
        sender: 'juan-pablo',
        timestamp: new Date().toLocaleTimeString()
      }]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowModeSelection(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (currentMode === null) {
    return (
      <div style={{ backgroundColor: 'black', minHeight: '100vh', color: 'white' }}>
        <Head>
          <title>Juan Pablo - Tu Profesor de Español CDMX</title>
        </Head>

        {!showModeSelection ? (
          <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            zIndex: 1000,
            backgroundColor: 'black'
          }}>
            <video 
              autoPlay 
              muted 
              playsInline
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover'
              }}
              onEnded={() => setShowModeSelection(true)}
            >
              <source src="https://res.cloudinary.com/ddrnwtfmh/video/upload/v1735802835/juan_pablo_sizzle_reel_final_l5rhkb.mp4" type="video/mp4" />
            </video>
          </div>
        ) : (
          <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '20px',
            background: 'black'
          }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              marginBottom: '3rem', 
              textAlign: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>
              Elige tu modo de aprendizaje
            </h1>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '2rem', 
              maxWidth: '1000px', 
              width: '100%' 
            }}>
              <div
                onClick={() => setCurrentMode('video')}
                style={{
                  background: 'transparent',
                  border: '2px solid white',
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.transform = 'translateY(-5px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🎥 Video Chat</h2>
                <p style={{ color: '#ccc' }}>Conversación cara a cara con Pedro</p>
              </div>

              <div
                onClick={startChatMode}
                style={{
                  background: 'transparent',
                  border: '2px solid white',
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.transform = 'translateY(-5px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>💬 Chat Texto</h2>
                <p style={{ color: '#ccc' }}>Conversación escrita con Juan Pablo</p>
              </div>

              <div
                onClick={() => setCurrentMode('game')}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: '2px solid white',
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  color: 'white',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-5px) scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)';
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: '#ff6b6b',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold'
                }}>
                  ✨ NUEVO
                </div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🎮 Juegos CDMX</h2>
                <p style={{ color: 'rgba(255,255,255,0.9)' }}>Práctica interactiva para México</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentMode === 'video') {
    return (
      <div style={{ backgroundColor: 'black', minHeight: '100vh', color: 'white', position: 'relative' }}>
        <Head>
          <title>Video Chat - Juan Pablo</title>
        </Head>
        
        <button
          onClick={() => setCurrentMode(null)}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            zIndex: 1000
          }}
        >
          ← Volver
        </button>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          padding: '20px',
          gap: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '800px',
            height: window.innerWidth <= 768 ? '60vh' : '70vh',
            backgroundColor: 'black',
            borderRadius: '8px',
            border: '3px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <iframe
              id="heygen-video"
              allow="camera; microphone"
              style={{
                width: window.innerWidth <= 768 ? '100%' : 'auto',
                height: window.innerWidth <= 768 ? 'auto' : '100%',
                maxWidth: '100%',
                border: 'none',
                objectFit: window.innerWidth <= 768 ? 'contain' : 'cover',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              src="https://app.heygen.com/embeds/7a5bde48925c4e5d93bfdc6ac97b9bdc"
            />
          </div>

          <div style={{
            width: '100%',
            maxWidth: '800px',
            display: 'flex',
            flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
            gap: '10px',
            alignItems: 'stretch'
          }}>
            <input
              type="text"
              placeholder="Escribe en inglés..."
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #333',
                backgroundColor: '#222',
                color: 'white',
                fontSize: '16px'
              }}
              onKeyPress={async (e) => {
                if (e.key === 'Enter' && e.target.value) {
                  const translated = await translateText(e.target.value);
                  document.getElementById('spanish-output').textContent = translated;
                  e.target.value = '';
                }
              }}
            />
            <div
              id="spanish-output"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #333',
                backgroundColor: '#111',
                color: '#4ade80',
                fontSize: '16px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Traducción en español aparecerá aquí...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentMode === 'chat') {
    return (
      <div style={{ backgroundColor: 'black', minHeight: '100vh', color: 'white' }}>
        <Head>
          <title>Chat - Juan Pablo</title>
        </Head>
        
        <button
          onClick={() => setCurrentMode(null)}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            zIndex: 1000
          }}
        >
          ← Volver
        </button>

        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto', 
          padding: '80px 20px 20px', 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          <div style={{
            flex: 1,
            background: 'transparent',
            border: '2px solid white',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              marginBottom: '20px',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '15px',
              backgroundColor: 'black'
            }}>
              {messages.map((message, index) => (
                <div key={index} style={{ 
                  marginBottom: '15px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: message.sender === 'user' ? 'white' : 'transparent',
                    color: message.sender === 'user' ? 'black' : 'white',
                    border: message.sender === 'juan-pablo' ? '1px solid #333' : 'none'
                  }}>
                    {message.text}
                  </div>
                  
                  {message.sender === 'juan-pablo' && (
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      marginTop: '8px',
                      alignItems: 'center'
                    }}>
                      <button
                        onClick={() => speakMessage(message.text, index)}
                        style={{
                          background: speakingMessageId === index ? '#4ade80' : 'transparent',
                          border: '1px solid #666',
                          color: speakingMessageId === index ? 'black' : 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        🔊 MX
                      </button>
                      
                      <button
                        onClick={() => translateMessage(message.text, index)}
                        disabled={translatingMessageId === index}
                        style={{
                          background: messageTranslations[index] ? '#3b82f6' : 'transparent',
                          border: '1px solid #666',
                          color: messageTranslations[index] ? 'white' : 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        {translatingMessageId === index ? '🔄' : '🇺🇸 EN'}
                      </button>
                    </div>
                  )}
                  
                  {messageTranslations[index] && (
                    <div style={{
                      maxWidth: '80%',
                      padding: '8px 12px',
                      marginTop: '5px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#93c5fd',
                      fontSize: '0.9rem',
                      fontStyle: 'italic'
                    }}>
                      {messageTranslations[index]}
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-start', 
                  marginBottom: '15px' 
                }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'transparent',
                    border: '1px solid #333',
                    color: 'white'
                  }}>
                    Juan Pablo está escribiendo...
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Escribe en inglés o español..."
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #333',
                  backgroundColor: '#222',
                  color: 'white',
                  fontSize: '16px'
                }}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button
                onClick={sendMessage}
                disabled={!userInput.trim() || isLoading}
                style={{
                  padding: '12px 24px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: userInput.trim() && !isLoading ? '#4ade80' : '#333',
                  color: userInput.trim() && !isLoading ? 'black' : '#666',
                  cursor: userInput.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentMode === 'game') {
    return (
      <div style={{ backgroundColor: 'black', minHeight: '100vh', color: 'white', padding: '20px' }}>
        <Head>
          <title>Juegos CDMX - Juan Pablo</title>
        </Head>
        
        <button
          onClick={() => setCurrentMode(null)}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          ← Volver a modos
        </button>

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              🎮 Juegos CDMX
            </h1>
            <p style={{ color: '#ccc', fontSize: '1.1rem' }}>Práctica interactiva para tu mudanza a Ciudad de México</p>
          </div>

          {/* Score Display */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px', 
            marginBottom: '30px',
            flexWrap: 'wrap'
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)', 
              padding: '10px 20px', 
              borderRadius: '25px',
              color: 'black',
              fontWeight: 'bold'
            }}>
              💎 Puntos: {score}
            </div>
            <div style={{ 
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
              padding: '10px 20px', 
              borderRadius: '25px',
              color: 'black',
              fontWeight: 'bold'
            }}>
              🔥 Racha: {streak}
            </div>
          </div>

          {!gameMode && (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ marginBottom: '30px', color: 'white' }}>Elige tu juego</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div
                  onClick={() => startGame('multiple')}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    padding: '30px',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>🤔 Opción Múltiple</h3>
                  <p style={{ color: 'rgba(255,255,255,0.9)' }}>Cultura y frases de CDMX</p>
                  <div style={{ marginTop: '15px', fontSize: '0.9rem', opacity: 0.8 }}>
                    +10 puntos por respuesta
                  </div>
                </div>

                <div
                  onClick={() => startGame('fillblank')}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    padding: '30px',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>✏️ Llenar Espacios</h3>
                  <p style={{ color: 'rgba(255,255,255,0.9)' }}>Situaciones reales en México</p>
                  <div style={{ marginTop: '15px', fontSize: '0.9rem', opacity: 0.8 }}>
                    +15 puntos por respuesta
                  </div>
                </div>
              </div>
            </div>
          )}

          {gameMode === 'multiple' && currentQuestion < multipleChoiceQuestions.length && (
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '30px', 
              borderRadius: '15px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <div style={{ color: '#666', marginBottom: '10px' }}>
                  Pregunta {currentQuestion + 1} de {multipleChoiceQuestions.length}
                </div>
                <div style={{ 
                  background: 'rgba(59, 130, 246, 0.2)', 
                  height: '4px', 
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    background: '#3b82f6', 
                    height: '100%', 
                    width: `${((currentQuestion + 1) / multipleChoiceQuestions.length) * 100}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              <h3 style={{ fontSize: '1.5rem', marginBottom: '30px', textAlign: 'center' }}>
                {multipleChoiceQuestions[currentQuestion].question}
              </h3>

              {!showResult ? (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {multipleChoiceQuestions[currentQuestion].options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleMultipleChoice(index)}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '2px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        padding: '15px 20px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255,255,255,0.2)';
                        e.target.style.borderColor = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255,255,255,0.1)';
                        e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '3rem', 
                    marginBottom: '20px',
                    animation: 'bounce 0.6s ease-in-out'
                  }}>
                    {isCorrect ? '🎉' : '😅'}
                  </div>
                  <h4 style={{ 
                    fontSize: '1.5rem', 
                    color: isCorrect ? '#4ade80' : '#f87171',
                    marginBottom: '15px'
                  }}>
                    {isCorrect ? '¡Correcto!' : '¡Casi!'}
                  </h4>
                  <p style={{ color: '#ccc', marginBottom: '20px', fontSize: '1.1rem' }}>
                    {multipleChoiceQuestions[currentQuestion].explanation}
                  </p>
                  {isCorrect && (
                    <div style={{ 
                      background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                      color: 'black',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      display: 'inline-block',
                      marginBottom: '20px',
                      fontWeight: 'bold'
                    }}>
                      +{10 + (streak * 2)} puntos
                    </div>
                  )}
                  <button
                    onClick={nextQuestion}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 30px',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </div>
          )}

          {gameMode === 'fillblank' && currentQuestion < fillBlankQuestions.length && (
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '30px', 
              borderRadius: '15px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <div style={{ color: '#666', marginBottom: '10px' }}>
                  Pregunta {currentQuestion + 1} de {fillBlankQuestions.length}
                </div>
                <div style={{ 
                  background: 'rgba(16, 185, 129, 0.2)', 
                  height: '4px', 
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    background: '#10b981', 
                    height: '100%', 
                    width: `${((currentQuestion + 1) / fillBlankQuestions.length) * 100}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', textAlign: 'center' }}>
                {fillBlankQuestions[currentQuestion].question}
              </h3>

              <div style={{ textAlign: 'center', marginBottom: '20px', color: '#4ade80' }}>
                💡 Pista: {fillBlankQuestions[currentQuestion].hint}
              </div>

              {!showResult ? (
                <div style={{ textAlign: 'center' }}>
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    style={{
                      padding: '15px 20px',
                      fontSize: '1.2rem',
                      borderRadius: '10px',
                      border: '2px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      textAlign: 'center',
                      marginBottom: '20px',
                      width: '100%',
                      maxWidth: '300px'
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && userAnswer.trim() && handleFillBlank()}
                  />
                  <br />
                  <button
                    onClick={handleFillBlank}
                    disabled={!userAnswer.trim()}
                    style={{
                      background: userAnswer.trim() ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#666',
                      color: 'white',
                      border: 'none',
                      padding: '12px 30px',
                      borderRadius: '25px',
                      cursor: userAnswer.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    Verificar ✓
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '3rem', 
                    marginBottom: '20px',
                    animation: 'bounce 0.6s ease-in-out'
                  }}>
                    {isCorrect ? '🎉' : '😅'}
                  </div>
                  <h4 style={{ 
                    fontSize: '1.5rem', 
                    color: isCorrect ? '#4ade80' : '#f87171',
                    marginBottom: '15px'
                  }}>
                    {isCorrect ? '¡Perfecto!' : `La respuesta era: "${fillBlankQuestions[currentQuestion].answer}"`}
                  </h4>
                  <p style={{ color: '#ccc', marginBottom: '20px', fontSize: '1.1rem' }}>
                    {fillBlankQuestions[currentQuestion].explanation}
                  </p>
                  {isCorrect && (
                    <div style={{ 
                      background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                      color: 'black',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      display: 'inline-block',
                      marginBottom: '20px',
                      fontWeight: 'bold'
                    }}>
                      +{15 + (streak * 3)} puntos
                    </div>
                  )}
                  <button
                    onClick={nextQuestion}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 30px',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </div>
          )}

          {gameMode === 'complete' && (
            <div style={{ 
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,193,7,0.1) 100%)',
              padding: '40px',
              borderRadius: '20px',
              border: '2px solid #ffd700'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🏆</div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', color: '#ffd700' }}>
                ¡Completaste el juego!
              </h2>
              <div style={{ fontSize: '1.5rem', marginBottom: '30px' }}>
                Puntuación final: <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{score} puntos</span>
              </div>
              <div style={{ marginBottom: '30px' }}>
                <div style={{ color: '#ffd700', marginBottom: '10px' }}>🎯 Estadísticas:</div>
                <div style={{ color: '#ccc' }}>
                  Racha máxima: {streak} respuestas consecutivas<br />
                  Preguntas completadas: {completedQuestions.length}
                </div>
              </div>
              <button
                onClick={resetGame}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '15px 40px',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}
              >
                🎮 Jugar de nuevo
              </button>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
          }
        `}</style>
      </div>
    );
  }

  return null;
}
