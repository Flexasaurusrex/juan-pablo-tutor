import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function JuanPablo() {
  const [currentMode, setCurrentMode] = useState(null); // null, 'video', 'chat', 'learning'
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
  
  // Learning system state
  const [selectedModule, setSelectedModule] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonStep, setLessonStep] = useState(0);
  const [lessonAnswers, setLessonAnswers] = useState({});
  const [userProgress, setUserProgress] = useState({
    completedLessons: ['transport_1', 'transport_2', 'transport_3'],
    currentStreak: 7,
    totalXP: 2340,
    level: 'Intermedio',
    weeklyGoal: 150,
    weeklyXP: 89
  });
  
  const recognitionRef = useRef(null);
  const pedroListenerRef = useRef(null);
  const videoRef = useRef(null);

  // CDMX Learning Modules Data
  const learningModules = [
    {
      id: 'transport',
      title: 'Transporte CDMX',
      icon: '🚇',
      description: 'Metro, Metrobús, taxis y Uber',
      lessons: 4,
      completed: 3,
      difficulty: 'Principiante',
      estimatedTime: '2 semanas',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 'food',
      title: 'Comida Mexicana',
      icon: '🌮',
      description: 'Restaurantes, mercados y street food',
      lessons: 15,
      completed: 5,
      difficulty: 'Intermedio',
      estimatedTime: '3 semanas',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      id: 'neighborhoods',
      title: 'Barrios CDMX',
      icon: '🏢',
      description: 'Roma Norte, Condesa, Polanco',
      lessons: 10,
      completed: 2,
      difficulty: 'Intermedio',
      estimatedTime: '2 semanas',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ];

  // Transport lessons with real content
  const getTransportLessons = () => [
    {
      id: 'transport_1',
      title: 'Comprando tu primera tarjeta del Metro',
      type: 'interactive',
      xpReward: 25,
      completed: userProgress.completedLessons.includes('transport_1'),
      content: {
        introduction: "Aprende las frases esenciales para comprar tu tarjeta del Metro en CDMX",
        steps: [
          {
            type: 'vocabulary',
            question: '¿Cómo se dice "Metro card" en español mexicano?',
            options: ['Tarjeta del Metro', 'Carta del tren', 'Boleto de autobús'],
            correct: 0,
            explanation: '¡Correcto! En CDMX se dice "Tarjeta del Metro".'
          },
          {
            type: 'phrase',
            question: 'Completa: "Una _____ del Metro, por favor"',
            answer: 'tarjeta',
            hint: 'Es lo que necesitas para entrar al Metro'
          }
        ]
      }
    },
    {
      id: 'transport_2',
      title: 'Direcciones: ¿Cómo llego a...?',
      type: 'conversation',
      xpReward: 30,
      completed: userProgress.completedLessons.includes('transport_2'),
      content: {
        introduction: "Aprende a pedir direcciones como un verdadero chilango",
        steps: [
          {
            type: 'vocabulary',
            question: '¿Cómo preguntas "How do I get to..." en español?',
            options: ['¿Cómo llego a...?', '¿Dónde está...?', '¿Cuándo voy a...?'],
            correct: 0,
            explanation: '"¿Cómo llego a...?" es la forma más común de pedir direcciones.'
          }
        ]
      }
    },
    {
      id: 'transport_3',
      title: 'Vocabulario: Medios de transporte',
      type: 'vocabulary',
      xpReward: 20,
      completed: userProgress.completedLessons.includes('transport_3'),
      content: {
        introduction: "Domina el vocabulario del transporte en CDMX",
        steps: [
          {
            type: 'vocabulary',
            question: '¿Cómo se llama el autobús pequeño compartido en CDMX?',
            options: ['Pesero', 'Camión', 'Taxi'],
            correct: 0,
            explanation: '"Pesero" son los minibuses compartidos en México.'
          }
        ]
      }
    },
    {
      id: 'transport_4',
      title: 'Pronunciación: Estaciones del Metro',
      type: 'pronunciation',
      xpReward: 35,
      completed: false,
      current: true,
      content: {
        introduction: "Practica la pronunciación de estaciones del Metro",
        steps: [
          {
            type: 'vocabulary',
            question: '¿Cuál es la estación del centro histórico?',
            options: ['Zócalo', 'Centro', 'Histórico'],
            correct: 0,
            explanation: 'Zócalo es la estación del centro histórico de CDMX'
          }
        ]
      }
    }
  ];

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

  const startLearningMode = () => {
    setCurrentMode('learning');
    setMessages([]);
  };

  const goBack = () => {
    setCurrentMode(null);
    setShowModeSelection(false);
    setMessages([]);
    setTranslatorInput('');
    setTranslatorOutput('');
    setMessageTranslations({});
    setSpeakingMessageId(null);
    setSelectedModule(null);
    setCurrentLesson(null);
    setLessonStep(0);
    setLessonAnswers({});
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

  // Intro Screen
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

  // Mode Selection Screen
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
              onClick={startLearningMode}
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
              
              <div style={{ fontSize: '2.5em', marginBottom: '15px' }}>📚</div>
              <h3 style={{ fontSize: '1.3em', marginBottom: '12px', color: 'white' }}>
                Lecciones CDMX
              </h3>
              <p style={{ fontSize: '0.9em', color: 'rgba(255,255,255,0.9)' }}>
                Sistema de aprendizaje profesional
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

  // Video Mode
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

  // Chat Mode
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

  // Learning Mode
  if (currentMode === 'learning') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#000000',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <Head>
          <title>Juan Pablo - Lecciones CDMX</title>
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
            cursor: 'pointer',
            zIndex: 1000
          }}
        >
          ← Volver
        </button>

        <div style={{ padding: '80px 20px 20px 20px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            {!selectedModule && !currentLesson ? (
              <>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '25px',
                  borderRadius: '20px',
                  marginBottom: '30px',
                  color: 'white'
                }}>
                  <h2 style={{ margin: 0, fontSize: '1.8em' }}>
                    ¡Hola! Preparándote para CDMX 🇲🇽
                  </h2>
                  <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>
                    Nivel {userProgress.level} • {userProgress.totalXP} XP Total
                  </p>
                </div>

                <h3 style={{ color: 'white', fontSize: '1.5em', marginBottom: '20px' }}>
                  📚 Módulos de Aprendizaje CDMX
                </h3>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                  gap: '25px' 
                }}>
                  {learningModules.map(module => (
                    <div 
                      key={module.id}
                      style={{
                        background: module.color,
                        borderRadius: '20px',
                        padding: '25px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => setSelectedModule(module)}
                    >
                      <div style={{ fontSize: '3em', marginBottom: '15px' }}>{module.icon}</div>
                      <h3 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '1.4em' }}>
                        {module.title}
                      </h3>
                      <p style={{ color: 'rgba(255,255,255,0.9)', margin: '0 0 15px 0' }}>
                        {module.description}
                      </p>
                      <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '20px',
                        padding: '8px 15px',
                        color: 'white',
                        textAlign: 'center'
                      }}>
                        {module.completed}/{module.lessons} lecciones
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : selectedModule && !currentLesson ? (
              <div>
                <button 
                  onClick={() => setSelectedModule(null)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    marginBottom: '20px'
                  }}
                >
                  ← Volver a módulos
                </button>

                <div style={{ 
                  background: selectedModule.color,
                  borderRadius: '20px',
                  padding: '30px',
                  marginBottom: '30px',
                  color: 'white'
                }}>
                  <div style={{ fontSize: '3em', marginBottom: '15px' }}>{selectedModule.icon}</div>
                  <h2 style={{ margin: '0 0 10px 0', fontSize: '2em' }}>
                    {selectedModule.title}
                  </h2>
                  <p style={{ margin: '0', fontSize: '1.1em' }}>
                    {selectedModule.description}
                  </p>
                </div>

                <div style={{ display: 'grid', gap: '15px' }}>
                  {getTransportLessons().map((lesson, index) => (
                    <div key={lesson.id} style={{
                      background: lesson.completed ? 'rgba(0,255,136,0.1)' : lesson.current ? 'rgba(255,193,7,0.1)' : 'rgba(255,255,255,0.05)',
                      border: lesson.current ? '2px solid #ffc107' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '15px',
                      padding: '20px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setCurrentLesson(lesson)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: lesson.completed ? '#00ff88' : lesson.current ? '#ffc107' : 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: lesson.completed || lesson.current ? '#000' : '#fff',
                            fontWeight: '700'
                          }}>
                            {lesson.completed ? '✓' : lesson.current ? '▶' : index + 1}
                          </div>
                          <div>
                            <h4 style={{ margin: 0, color: 'white', fontSize: '1.1em' }}>
                              {lesson.title}
                            </h4>
                            <p style={{ margin: '5px 0 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.9em' }}>
                              {lesson.type === 'interactive' && '🎯 Práctica interactiva'}
                              {lesson.type === 'conversation' && '💬 Conversación'}
                              {lesson.type === 'vocabulary' && '📚 Vocabulario'}
                              {lesson.type === 'pronunciation' && '🔊 Pronunciación'}
                            </p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#ffc107', fontWeight: '600' }}>
                            +{lesson.xpReward} XP
                          </div>
                          <button style={{
                            background: lesson.completed ? 'rgba(0,255,136,0.2)' : '#ffc107',
                            color: lesson.completed ? '#00ff88' : '#000',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '0.8em',
                            fontWeight: '600',
                            marginTop: '5px',
                            cursor: 'pointer'
                          }}>
                            {lesson.completed ? 'Completado' : lesson.current ? 'Continuar' : 'Empezar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : currentLesson ? (
              <div style={{ 
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: '#000000',
                zIndex: 2000,
                padding: '20px',
                overflow: 'auto'
              }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                    <button 
                      onClick={() => {
                        setCurrentLesson(null);
                        setLessonStep(0);
                        setLessonAnswers({});
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        marginRight: '20px'
                      }}
                    >
                      ← Volver a lecciones
                    </button>
                    <div>
                      <h2 style={{ color: 'white', margin: 0, fontSize: '1.5em' }}>
                        {currentLesson.title}
                      </h2>
                      <p style={{ color: 'rgba(255,255,255,0.7)', margin: '5px 0 0 0' }}>
                        +{currentLesson.xpReward} XP
                      </p>
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '20px',
                    padding: '30px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ textAlign: 'center', color: 'white' }}>
                      <div style={{ fontSize: '3em', marginBottom: '20px' }}>🚇</div>
                      <h3 style={{ margin: '0 0 15px 0', fontSize: '1.8em' }}>
                        {currentLesson.content.introduction}
                      </h3>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1em' }}>
                        ¡Lección interactiva disponible pronto!
                      </p>
                      <button
                        onClick={() => {
                          setCurrentLesson(null);
                          setLessonStep(0);
                          setLessonAnswers({});
                        }}
                        style={{
                          background: '#00ff88',
                          color: '#000',
                          border: 'none',
                          padding: '15px 30px',
                          borderRadius: '25px',
                          fontSize: '1.1em',
                          fontWeight: '600',
                          cursor: 'pointer',
                          marginTop: '20px'
                        }}
                      >
                        Volver a lecciones
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
