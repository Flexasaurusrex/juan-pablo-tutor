import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function JuanPablo() {
  const [currentMode, setCurrentMode] = useState(null); // null, 'video', 'chat', 'game'
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [isListeningToPedro, setIsListeningToPedro] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Translation features
  const [messageTranslations, setMessageTranslations] = useState({});
  const [translatingMessageId, setTranslatingMessageId] = useState(null);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  
  // Translator state for video mode
  const [translatorInput, setTranslatorInput] = useState('');
  const [translatorOutput, setTranslatorOutput] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Game state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [gameMode, setGameMode] = useState(null); // 'multiple', 'fillblank'
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [streak, setStreak] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState([]);
  
  const recognitionRef = useRef(null);
  const pedroListenerRef = useRef(null);
  const videoRef = useRef(null);

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

  // Proper mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Translator function for video mode
  const translateText = async (text) => {
    if (!text.trim()) return;
    
    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() })
      });
      
      const data = await response.json();
      if (data.translation) {
        setTranslatorOutput(data.translation);
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatorOutput('Error de traducción');
    }
    setIsTranslating(false);
  };

  // Translate Juan Pablo's message to English
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

  // Speak Juan Pablo's message with Mexican Spanish pronunciation
  const speakMessage = async (messageText, messageIndex) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setSpeakingMessageId(null);
    }

    if (speakingMessageId === messageIndex) {
      return;
    }

    setSpeakingMessageId(messageIndex);

    try {
      const cleanText = messageText
        .replace(/[🎯📚🔄✏️🌮🚇👋💼🆘💰🏢🇲🇽😊👍💪🎙️✅❌📝📡🚀⚠️🔍🤖🌟]/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/•/g, '')
        .trim();

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        utterance.lang = 'es-MX';
        utterance.rate = 0.85;
        utterance.pitch = 1.0;
        utterance.volume = 0.9;

        const voices = speechSynthesis.getVoices();
        const mexicanVoice = voices.find(voice => 
          voice.lang.includes('es-MX') || 
          voice.lang.includes('es-US') ||
          (voice.lang.includes('es') && voice.name.toLowerCase().includes('mexican'))
        );
        
        if (mexicanVoice) {
          utterance.voice = mexicanVoice;
        }

        utterance.onend = () => {
          setSpeakingMessageId(null);
          setCurrentAudio(null);
        };

        utterance.onerror = () => {
          setSpeakingMessageId(null);
          setCurrentAudio(null);
        };

        setCurrentAudio(utterance);
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      setSpeakingMessageId(null);
    }
  };

  const startVideoMode = () => {
    setCurrentMode('video');
    setMessages([
      { text: "¡Hola! Habla conmigo directamente para practicar conversación.", sender: 'juan' }
    ]);
    setTimeout(loadHeyGenEmbed, 1000);
  };

  const startChatMode = () => {
    setCurrentMode('chat');
    setMessages([
      { 
        text: "¡Hola! 👋🇲🇽 Soy Juan Pablo, tu profesor de español mexicano. Estoy súper emocionado de ayudarte a prepararte para tu mudanza a Ciudad de México en septiembre.\n\n🎯 Puedo ayudarte con:\n• Correcciones de gramática y pronunciación\n• Frases útiles para la vida diaria en CDMX\n• Modismos y cultura mexicana\n• Situaciones reales (transporte, comida, trabajo)\n\n¿En qué te gustaría empezar a practicar hoy? Puedes escribir en inglés o español - ¡yo te ayudo! 😊", 
        sender: 'juan' 
      }
    ]);
  };

  const startGameMode = () => {
    setCurrentMode('game');
  };

  const goBack = () => {
    setCurrentMode(null);
    setShowModeSelection(false);
    setMessages([]);
    setTranslatorInput('');
    setTranslatorOutput('');
    setMessageTranslations({});
    setSpeakingMessageId(null);
    setGameMode(null);
    setCurrentQuestion(0);
    setScore(0);
    setStreak(0);
    setCompletedQuestions([]);
    setShowResult(false);
    setUserAnswer('');
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
  };

  const handleVideoEnd = () => {
    setShowModeSelection(true);
  };

  const skipIntro = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setShowModeSelection(true);
  };

  const loadHeyGenEmbed = () => {
    setTimeout(() => {
      const container = document.getElementById('avatar-video-container');
      if (!container) return;

      const existingEmbed = document.getElementById('heygen-streaming-embed');
      if (existingEmbed) {
        existingEmbed.remove();
      }

      const host = "https://labs.heygen.com";
      const shareParams = "eyJxdWFsaXR5IjoiaGlnaCIsImF2YXRhck5hbWUiOiJQZWRyb19Qcm9mZXNzaW9uYWxMb29rMl9wdWJsaWMiLCJwcmV2aWV3SW1nIjoiaHR0cHM6Ly9maWxlczIuaGV5Z2VuLmFpL2F2YXRhci92My9mOWM5NGFlN2JkMTU0NWU4YjY1MzFhOTFiYTk3NmFkOV81NTkxMC9wcmV2aWV3X3RhbGtfMS53ZWJwIiwibmVlZFJlbW92ZUJhY2tncm91bmQiOnRydWUsImtub3dsZWRnZUJhc2VJZCI6ImE0MjZkNGFjYWUzMTQ0MTI4NWZkMGViZjk3YTU2ZjA3IiwidXNlcm5hbWUiOiI4NjE0MmI4MzMyM2Q0YmY0YmFlMmM5OTFmYWFmZmE5YyJ9";
      const url = host + "/guest/streaming-embed?share=" + shareParams + "&inIFrame=1";
      
      const wrapDiv = document.createElement("div");
      wrapDiv.id = "heygen-streaming-embed";
      
      const containerDiv = document.createElement("div");
      containerDiv.id = "heygen-streaming-container";
      
      const stylesheet = document.createElement("style");
      stylesheet.innerHTML = `
        #heygen-streaming-embed {
          z-index: 1000;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 15px;
          overflow: hidden;
          transition: all linear 0.1s;
          opacity: 0;
          visibility: hidden;
        }
        #heygen-streaming-embed.show {
          opacity: 1;
          visibility: visible;
        }
        #heygen-streaming-container {
          width: 100%;
          height: 100%;
        }
        #heygen-streaming-container iframe {
          width: 100%;
          height: 100%;
          border: 0;
          border-radius: 15px;
        }
      `;
      
      const iframe = document.createElement("iframe");
      iframe.allowFullscreen = false;
      iframe.title = "Juan Pablo - Pedro";
      iframe.role = "dialog";
      iframe.allow = "microphone";
      iframe.src = url;
      
      window.addEventListener("message", (e) => {
        if (e.origin === host && e.data && e.data.type && "streaming-embed" === e.data.type) {
          if ("init" === e.data.action) {
            wrapDiv.classList.toggle("show", true);
            setAvatarLoaded(true);
          }
        }
      });
      
      containerDiv.appendChild(iframe);
      wrapDiv.appendChild(stylesheet);
      wrapDiv.appendChild(containerDiv);
      container.appendChild(wrapDiv);
    }, 500);
  };

  const startVoiceInput = () => {
    if (recognitionRef.current) {
      setIsLoading(true);
      recognitionRef.current.start();
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = { text: inputMessage, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: inputMessage,
          conversationHistory: messages
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const juanPabloResponse = data.reply || data.response;
      
      if (juanPabloResponse) {
        setMessages(prev => [...prev, { text: juanPabloResponse, sender: 'juan' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        text: "Lo siento, hubo un error de conexión. 😅 ¿Puedes intentar escribir tu mensaje otra vez?", 
        sender: 'juan' 
      }]);
    }

    setInputMessage('');
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognitionRef.current = new webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-MX';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
      };

      recognitionRef.current.onerror = () => {
        setIsLoading(false);
      };

      recognitionRef.current.onend = () => {
        setIsLoading(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Intro Screen - KEEPING EXACTLY AS IS
  if (!currentMode && !showModeSelection) {
    return (
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Head>
          <title>Juan Pablo - Spanish Learning AI</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        </Head>
        
        <video 
          ref={videoRef}
          autoPlay 
          muted 
          playsInline
          onEnded={handleVideoEnd}
          style={{ 
            width: isMobile ? '100%' : 'auto', 
            height: isMobile ? 'auto' : '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: isMobile ? 'contain' : 'cover',
            objectPosition: 'center'
          }}
        >
          <source src="/intro-sizzle.mp4" type="video/mp4" />
        </video>
        
        <button
          onClick={skipIntro}
          style={{
            position: 'absolute',
            top: isMobile ? '15px' : '20px',
            right: isMobile ? '15px' : '20px',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: isMobile ? '8px 16px' : '10px 20px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: 'bold',
            backdropFilter: 'blur(10px)',
            zIndex: 10000
          }}
        >
          Saltar Intro →
        </button>
      </div>
    );
  }

  // Mode Selection Screen - UPDATED TO INCLUDE GAME
  if (!currentMode) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        width: '100vw',
        background: '#000000',
        position: 'fixed',
        top: 0,
        left: 0,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <Head>
          <title>Juan Pablo - Choose Your Learning Style</title>
        </Head>
        
        <div style={{ maxWidth: '1000px', width: '100%', textAlign: 'center' }}>
          <div style={{ marginBottom: '60px' }}>
            <h1 style={{ 
              fontSize: isMobile ? '2.5em' : '3.5em', 
              marginBottom: '20px', 
              color: 'white', 
              fontWeight: '700'
            }}>
              ¡Hola! Soy Juan Pablo 🇲🇽
            </h1>
            <p style={{ 
              fontSize: isMobile ? '1.1em' : '1.3em', 
              color: 'rgba(255,255,255,0.8)', 
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Tu compañero de español para prepararte para Ciudad de México
            </p>
          </div>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
            gap: '25px',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            <div 
              onClick={startVideoMode}
              style={{ 
                background: '#1a1a1a',
                border: '2px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                padding: '30px 25px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ fontSize: '2.5em', marginBottom: '15px' }}>🎥</div>
              <h3 style={{ fontSize: '1.3em', marginBottom: '12px', color: 'white' }}>
                Video Chat
              </h3>
              <p style={{ fontSize: '0.9em', color: 'rgba(255,255,255,0.7)' }}>
                Conversación cara a cara con Pedro
              </p>
            </div>
            
            <div 
              onClick={startChatMode}
              style={{ 
                background: '#1a1a1a',
                border: '2px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                padding: '30px 25px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ fontSize: '2.5em', marginBottom: '15px' }}>💬</div>
              <h3 style={{ fontSize: '1.3em', marginBottom: '12px', color: 'white' }}>
                Chat Texto
              </h3>
              <p style={{ fontSize: '0.9em', color: 'rgba(255,255,255,0.7)' }}>
                Conversación por texto con Juan Pablo
              </p>
            </div>

            <div 
              onClick={startGameMode}
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '16px',
                padding: '30px 25px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(255,255,255,0.2)',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '0.7em',
                color: 'white'
              }}>
                ✨ NUEVO
              </div>
              
              <div style={{ fontSize: '2.5em', marginBottom: '15px' }}>🎮</div>
              <h3 style={{ fontSize: '1.3em', marginBottom: '12px', color: 'white' }}>
                Juegos CDMX
              </h3>
              <p style={{ fontSize: '0.9em', color: 'rgba(255,255,255,0.9)' }}>
                Práctica interactiva para México
              </p>
            </div>
          </div>
          
          <div style={{ marginTop: '50px' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9em' }}>
              Preparándote para México • Septiembre 2024
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Video Mode - KEEPING EXACTLY AS IS
  if (currentMode === 'video') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <Head>
          <title>Juan Pablo - Conversación con Pedro</title>
        </Head>
        
        <button
          onClick={goBack}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          ← Volver
        </button>

        <div style={{ width: '100%', maxWidth: '800px', marginBottom: '30px' }}>
          <div 
            id="avatar-video-container"
            style={{ 
              width: '100%',
              height: '500px',
              background: '#1a1a1a',
              border: '2px solid #ffffff',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {!avatarLoaded && (
              <div style={{ textAlign: 'center', color: 'white' }}>
                <div style={{ fontSize: '18px' }}>
                  Conectando con Pedro...
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{
          width: '100%',
          maxWidth: '800px',
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{ color: 'white', margin: '0 0 20px 0', textAlign: 'center' }}>
            Traductor Inglés → Español
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '8px' }}>
                Inglés
              </label>
              <textarea
                value={translatorInput}
                onChange={(e) => setTranslatorInput(e.target.value)}
                placeholder="What do you want to say?"
                style={{
                  width: '100%',
                  height: '100px',
                  background: '#000',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  color: 'white',
                  padding: '12px',
                  resize: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '8px' }}>
                Español
              </label>
              <div style={{
                width: '100%',
                height: '100px',
                background: '#000',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                color: 'white',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {isTranslating ? 'Traduciendo...' : translatorOutput || 'La traducción aparecerá aquí'}
              </div>
            </div>
          </div>

          <button
            onClick={() => translateText(translatorInput)}
            disabled={!translatorInput.trim() || isTranslating}
            style={{
              width: '100%',
              background: translatorInput.trim() && !isTranslating ? '#ffffff' : 'rgba(255,255,255,0.2)',
              color: translatorInput.trim() && !isTranslating ? '#000' : 'rgba(255,255,255,0.5)',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: translatorInput.trim() && !isTranslating ? 'pointer' : 'not-allowed'
            }}
          >
            {isTranslating ? 'Traduciendo...' : 'Traducir'}
          </button>
        </div>
      </div>
    );
  }

  // Chat Mode - KEEPING EXACTLY AS IS
  if (currentMode === 'chat') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#000000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <Head>
          <title>Juan Pablo - Chat Texto</title>
        </Head>
        
        <div style={{ 
          background: '#1a1a1a',
          border: '2px solid rgba(255,255,255,0.2)',
          borderRadius: '16px', 
          padding: '30px',
          width: '100%',
          maxWidth: '800px',
          height: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <button
              onClick={goBack}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                marginRight: '15px'
              }}
            >
              ← Volver
            </button>
            <h2 style={{ color: 'white', margin: 0, fontSize: '1.8em' }}>
              Chat con Juan Pablo 💬
            </h2>
          </div>
          
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            marginBottom: '20px',
            padding: '20px',
            background: '#000000',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ 
                padding: '15px 20px',
                borderRadius: '12px',
                background: msg.sender === 'user' ? '#ffffff' : 'rgba(255,255,255,0.1)',
                color: msg.sender === 'user' ? '#000' : 'white',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                border: msg.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ 
                  fontSize: '0.8em', 
                  fontWeight: '600', 
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>{msg.sender === 'user' ? 'Tú' : 'Juan Pablo'}</span>
                  {msg.sender === 'juan' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakMessage(msg.text, index);
                        }}
                        style={{
                          background: speakingMessageId === index ? 'rgba(0,255,0,0.2)' : 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.9em',
                          cursor: 'pointer'
                        }}
                      >
                        {speakingMessageId === index ? '⏸️' : '🔊'} MX
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          translateMessage(msg.text, index);
                        }}
                        style={{
                          background: messageTranslations[index] ? 'rgba(0,150,255,0.2)' : 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.9em',
                          cursor: 'pointer'
                        }}
                      >
                        {translatingMessageId === index ? '🔄' : '🇺🇸'} EN
                      </button>
                    </div>
                  )}
                </div>
                
                <div>{msg.text}</div>
                
                {messageTranslations[index] && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontStyle: 'italic',
                    borderLeft: '3px solid #0096ff'
                  }}>
                    🇺🇸 <strong>English:</strong> {messageTranslations[index]}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div style={{ 
                padding: '15px 20px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
                fontStyle: 'italic',
                alignSelf: 'flex-start',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                Juan Pablo está escribiendo...
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje en español o inglés..."
              style={{
                flex: 1,
                padding: '15px',
                background: '#000',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '12px',
                resize: 'none',
                minHeight: '60px',
                color: 'white'
              }}
              rows={2}
            />
            <button
              onClick={startVoiceInput}
              disabled={isLoading}
              style={{
                padding: '15px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                borderRadius: '12px',
                cursor: 'pointer',
                width: '60px',
                height: '60px'
              }}
            >
              🎙️
            </button>
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              style={{
                padding: '15px 25px',
                background: inputMessage.trim() ? '#ffffff' : 'rgba(255,255,255,0.3)',
                color: inputMessage.trim() ? '#000' : 'rgba(255,255,255,0.5)',
                border: 'none',
                borderRadius: '12px',
                cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
                height: '60px'
              }}
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game Mode - NEW SIMPLE GAME
  if (currentMode === 'game') {
    return (
      <div style={{ backgroundColor: 'black', minHeight: '100vh', color: 'white', padding: '20px' }}>
        <Head>
          <title>Juegos CDMX - Juan Pablo</title>
        </Head>
        
        <button
          onClick={goBack}
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
                    marginBottom: '20px'
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
                    marginBottom: '20px'
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
      </div>
    );
  }

  return null;
}
