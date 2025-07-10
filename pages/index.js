const startChatMode = () => {
    setCurrentMode('chat');
    setMessages([
      { 
        text: "¡Hola! 👋🇲🇽 Soy Juan Pablo, tu profesor de español mexicano. Estoy súper emocionado de ayudarte a prepararte para tu mudanza a Ciudad de México en septiembre.\n\n🎯 Puedo ayudarte con:\n• Correcciones de gramática y pronunciación\n• Frases útiles para la vida diaria en CDMX\n• Modismos y cultura mexicana\n• Situaciones reales (transporte, comida, trabajo)\n\n¿En qué te gustaría empezar a practicar hoy? Puedes escribir en inglés o español - ¡yo te ayudo! 😊", 
        sender: 'juan' 
      }
    ]);
  };import { useState, useEffect, useRef } from 'react';
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
  
  // Translation features - ALL state variables defined here
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
  const [userProgress, setUserProgress] = useState({
    completedLessons: [],
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
      lessons: 12,
      completed: 8,
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

  // Sample lessons for transport module
  const transportLessons = [
    {
      id: 1,
      title: 'Comprando tu primera tarjeta del Metro',
      type: 'interactive',
      scenario: 'metro_station',
      xpReward: 25,
      completed: true
    },
    {
      id: 2,
      title: 'Direcciones: ¿Cómo llego a...?',
      type: 'conversation',
      scenario: 'asking_directions',
      xpReward: 30,
      completed: true
    },
    {
      id: 3,
      title: 'Vocabulario: Medios de transporte',
      type: 'vocabulary',
      scenario: 'transport_vocab',
      xpReward: 20,
      completed: true
    },
    {
      id: 4,
      title: 'Pronunciación: Estaciones del Metro',
      type: 'pronunciation',
      scenario: 'metro_stations',
      xpReward: 35,
      completed: false,
      current: true
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

  // Translator function for video mode (English to Spanish)
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

  // Translate Juan Pablo's message to English (for chat mode) - ONLY ONE DEFINITION
  const translateMessage = async (messageText, messageIndex) => {
    if (messageTranslations[messageIndex]) {
      // If already translated, hide the translation
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
    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setSpeakingMessageId(null);
    }

    // If clicking the same message that's already speaking, just stop
    if (speakingMessageId === messageIndex) {
      return;
    }

    setSpeakingMessageId(messageIndex);

    try {
      // Clean the text for better TTS (remove emojis, extra formatting)
      const cleanText = messageText
        .replace(/[🎯📚🔄✏️🌮🚇👋💼🆘💰🏢🇲🇽😊👍💪🎙️✅❌📝📡🚀⚠️🔍🤖🌟]/g, '') // Remove emojis
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/•/g, '') // Remove bullet points
        .trim();

      // Use high-quality Mexican Spanish TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Configure for Mexican Spanish
        utterance.lang = 'es-MX'; // Mexican Spanish
        utterance.rate = 0.85; // Slightly slower for learning
        utterance.pitch = 1.0;
        utterance.volume = 0.9;

        // Try to find a Mexican Spanish voice
        const voices = speechSynthesis.getVoices();
        const mexicanVoice = voices.find(voice => 
          voice.lang.includes('es-MX') || 
          voice.lang.includes('es-US') ||
          (voice.lang.includes('es') && voice.name.toLowerCase().includes('mexican'))
        );
        
        if (mexicanVoice) {
          utterance.voice = mexicanVoice;
          console.log('🎙️ Using voice:', mexicanVoice.name, mexicanVoice.lang);
        } else {
          // Fallback to any Spanish voice
          const spanishVoice = voices.find(voice => voice.lang.startsWith('es'));
          if (spanishVoice) {
            utterance.voice = spanishVoice;
            console.log('🎙️ Using fallback Spanish voice:', spanishVoice.name);
          }
        }

        utterance.onend = () => {
          setSpeakingMessageId(null);
          setCurrentAudio(null);
        };

        utterance.onerror = (error) => {
          console.error('Speech synthesis error:', error);
          setSpeakingMessageId(null);
          setCurrentAudio(null);
        };

        // Store reference for stopping
        setCurrentAudio(utterance);
        
        speechSynthesis.speak(utterance);
        console.log('🔊 Speaking Mexican Spanish:', cleanText.substring(0, 50) + '...');
        
      } else {
        console.error('Speech synthesis not supported');
        setSpeakingMessageId(null);
      }

    } catch (error) {
      console.error('Error speaking message:', error);
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
    console.log('🎬 Loading HeyGen embed with Creator plan...');
    
    setTimeout(() => {
      const container = document.getElementById('avatar-video-container');
      if (!container) {
        console.error('❌ Avatar container not found');
        return;
      }

      // Remove existing embed if any
      const existingEmbed = document.getElementById('heygen-streaming-embed');
      if (existingEmbed) {
        existingEmbed.remove();
      }

      // Create the HeyGen embed with Creator plan (no time limits)
      const host = "https://labs.heygen.com";
      const shareParams = "eyJxdWFsaXR5IjoiaGlnaCIsImF2YXRhck5hbWUiOiJQZWRyb19Qcm9mZXNzaW9uYWxMb29rMl9wdWJsaWMiLCJwcmV2aWV3SW1nIjoiaHR0cHM6Ly9maWxlczIuaGV5Z2VuLmFpL2F2YXRhci92My9mOWM5NGFlN2JkMTU0NWU4YjY1MzFhOTFiYTk3NmFkOV81NTkxMC9wcmV2aWV3X3RhbGtfMS53ZWJwIiwibmVlZFJlbW92ZUJhY2tncm91bmQiOnRydWUsImtub3dsZWRnZUJhc2VJZCI6ImE0MjZkNGFjYWUzMTQ0MTI4NWZkMGViZjk3YTU2ZjA3IiwidXNlcm5hbWUiOiI4NjE0MmI4MzMyM2Q0YmY0YmFlMmM5OTFmYWFmZmE5YyJ9";
      const url = host + "/guest/streaming-embed?share=" + shareParams + "&inIFrame=1";
      
      const clientWidth = document.body.clientWidth;
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
      iframe.title = "Juan Pablo - Pedro (Creator Plan)";
      iframe.role = "dialog";
      iframe.allow = "microphone";
      iframe.src = url;
      
      let visible = false;
      let initial = false;
      
      window.addEventListener("message", (e) => {
        if (e.origin === host && e.data && e.data.type && "streaming-embed" === e.data.type) {
          if ("init" === e.data.action) {
            initial = true;
            wrapDiv.classList.toggle("show", initial);
            setAvatarLoaded(true);
            console.log('✅ Pedro loaded successfully with Creator plan (unlimited time)');
          }
        }
      });
      
      containerDiv.appendChild(iframe);
      wrapDiv.appendChild(stylesheet);
      wrapDiv.appendChild(containerDiv);
      container.appendChild(wrapDiv);
      
      console.log('🎬 HeyGen embed created with Creator plan - should have no time limits');
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

    console.log('🚀 Sending message to chat API:', inputMessage);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: inputMessage,
          conversationHistory: messages // Send conversation context
        })
      });

      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📝 API Response data:', data);
      
      // Handle both 'reply' and 'response' fields for compatibility
      const juanPabloResponse = data.reply || data.response;
      
      if (juanPabloResponse) {
        setMessages(prev => [...prev, { text: juanPabloResponse, sender: 'juan' }]);
        console.log('✅ Added Juan Pablo response to messages');
      } else {
        console.error('❌ No reply/response field in API data:', data);
        setMessages(prev => [...prev, { 
          text: "¡Hola! 👋 Parece que tuve un problema técnico. ¿Puedes intentar de nuevo? Estoy aquí para ayudarte a practicar español. 🇲🇽", 
          sender: 'juan' 
        }]);
      }
    } catch (error) {
      console.error('❌ Chat API Error:', error);
      setMessages(prev => [...prev, { 
        text: "Lo siento, hubo un error de conexión. 😅 ¿Puedes intentar escribir tu mensaje otra vez? ¡Estoy aquí para ayudarte!", 
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
    // Initialize speech recognition for user input
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      // User voice input (converts to text for sending)
      recognitionRef.current = new webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-MX';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        console.log('🎙️ User said:', transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
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

  // Intro Screen with Sizzle Reel
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
          <meta name="description" content="Learn Spanish with Juan Pablo" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        </Head>
        
        <video 
          ref={videoRef}
          autoPlay 
          muted 
          playsInline
          onEnded={handleVideoEnd}
          onLoadStart={() => console.log('Video loading started')}
          onCanPlay={() => console.log('Video can play')}
          onError={(e) => {
            console.error('Video error:', e);
            setTimeout(() => setShowModeSelection(true), 2000);
          }}
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
          Your browser does not support the video tag.
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
            zIndex: 10000,
            touchAction: 'manipulation'
          }}
        >
          Saltar Intro →
        </button>
      </div>
    );
  }

  // Mode Selection Screen - Dark Theme
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
        zIndex: 1000,
        overflow: 'auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <Head>
          <title>Juan Pablo - Choose Your Learning Style</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        </Head>
        
        <div style={{ 
          maxWidth: '1000px', 
          width: '100%', 
          textAlign: 'center'
        }}>
          {/* Hero Section */}
          <div style={{ marginBottom: '60px' }}>
            <h1 style={{ 
              fontSize: isMobile ? '2.5em' : '3.5em', 
              marginBottom: '20px', 
              color: 'white', 
              fontWeight: '700',
              lineHeight: '1.1',
              letterSpacing: '-0.02em'
            }}>
              ¡Hola! Soy Juan Pablo 🇲🇽
            </h1>
            <p style={{ 
              fontSize: isMobile ? '1.1em' : '1.3em', 
              color: 'rgba(255,255,255,0.8)', 
              fontWeight: '400',
              lineHeight: '1.6',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Tu compañero de español para prepararte para Ciudad de México
            </p>
          </div>
          
          {/* Mode Cards */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
            gap: '25px',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            {/* Video Mode Card */}
            <div 
              onClick={startVideoMode}
              style={{ 
                background: '#1a1a1a',
                border: '2px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                padding: '30px 25px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation'
              }}
              onMouseOver={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.4)';
                e.target.style.transform = 'translateY(-4px)';
              }}
              onMouseOut={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ 
                fontSize: '2.5em', 
                marginBottom: '15px'
              }}>
                🎥
              </div>
              <h3 style={{ 
                fontSize: '1.3em', 
                marginBottom: '12px', 
                fontWeight: '600',
                color: 'white'
              }}>
                Video Chat
              </h3>
              <p style={{ 
                fontSize: '0.9em', 
                color: 'rgba(255,255,255,0.7)', 
                lineHeight: '1.4',
                fontWeight: '400'
              }}>
                Conversación cara a cara con Pedro
              </p>
            </div>
            
            {/* Chat Mode Card */}
            <div 
              onClick={startChatMode}
              style={{ 
                background: '#1a1a1a',
                border: '2px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                padding: '30px 25px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation'
              }}
              onMouseOver={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.4)';
                e.target.style.transform = 'translateY(-4px)';
              }}
              onMouseOut={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ 
                fontSize: '2.5em', 
                marginBottom: '15px'
              }}>
                💬
              </div>
              <h3 style={{ 
                fontSize: '1.3em', 
                marginBottom: '12px', 
                fontWeight: '600',
                color: 'white'
              }}>
                Chat Texto
              </h3>
              <p style={{ 
                fontSize: '0.9em', 
                color: 'rgba(255,255,255,0.7)', 
                lineHeight: '1.4',
                fontWeight: '400'
              }}>
                Conversación por texto con Juan Pablo
              </p>
            </div>

            {/* NEW Learning Mode Card */}
            <div 
              onClick={startLearningMode}
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '16px',
                padding: '30px 25px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-6px)';
                e.target.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {/* Premium badge */}
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(255,255,255,0.2)',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '0.7em',
                fontWeight: '600',
                color: 'white'
              }}>
                ✨ NUEVO
              </div>
              
              <div style={{ 
                fontSize: '2.5em', 
                marginBottom: '15px'
              }}>
                📚
              </div>
              <h3 style={{ 
                fontSize: '1.3em', 
                marginBottom: '12px', 
                fontWeight: '600',
                color: 'white'
              }}>
                Lecciones CDMX
              </h3>
              <p style={{ 
                fontSize: '0.9em', 
                color: 'rgba(255,255,255,0.9)', 
                lineHeight: '1.4',
                fontWeight: '400'
              }}>
                Sistema de aprendizaje profesional
              </p>
            </div>
          </div>
          
          {/* Bottom CTA */}
          <div style={{ 
            marginTop: '50px',
            textAlign: 'center'
          }}>
            <p style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.9em',
              fontStyle: 'italic'
            }}>
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
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        </Head>
        
        {/* Back Button */}
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
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.2)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.1)';
          }}
        >
          ← Volver
        </button>

        {/* Pedro Video Container - Zoom Call Style */}
        <div style={{
          width: '100%',
          maxWidth: '800px',
          marginBottom: '30px'
        }}>
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
                <div style={{ 
                  width: '60px',
                  height: '60px',
                  border: '3px solid rgba(255,255,255,0.3)',
                  borderTop: '3px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 20px'
                }} />
                <div style={{ fontSize: '18px', fontWeight: '500' }}>
                  Conectando con Pedro...
                </div>
              </div>
            )}
            
            {/* Pedro name overlay like Zoom */}
            {avatarLoaded && (
              <div style={{
                position: 'absolute',
                bottom: '15px',
                left: '15px',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Pedro - Profesor de Español
              </div>
            )}
          </div>
        </div>

        {/* English to Spanish Translator */}
        <div style={{
          width: '100%',
          maxWidth: '800px',
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{
            color: 'white',
            margin: '0 0 20px 0',
            fontSize: '18px',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            Traductor Inglés → Español
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '20px',
            marginBottom: '20px'
          }}>
            {/* English Input */}
            <div>
              <label style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                display: 'block'
              }}>
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
                  fontSize: '14px',
                  resize: 'none',
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.6)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.3)';
                }}
              />
            </div>

            {/* Spanish Output */}
            <div>
              <label style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                display: 'block'
              }}>
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
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100px'
              }}>
                {isTranslating ? (
                  <div style={{ 
                    color: 'rgba(255,255,255,0.6)',
                    fontStyle: 'italic'
                  }}>
                    Traduciendo...
                  </div>
                ) : translatorOutput ? (
                  <div style={{ 
                    width: '100%',
                    lineHeight: '1.4'
                  }}>
                    {translatorOutput}
                  </div>
                ) : (
                  <div style={{ 
                    color: 'rgba(255,255,255,0.4)',
                    fontStyle: 'italic'
                  }}>
                    La traducción aparecerá aquí
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Translate Button */}
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
              fontSize: '14px',
              fontWeight: '600',
              cursor: translatorInput.trim() && !isTranslating ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease'
            }}
          >
            {isTranslating ? 'Traduciendo...' : 'Traducir'}
          </button>
        </div>

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Chat Mode - Dark Theme with Translation and Pronunciation Features
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
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
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
          {/* Header */}
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
                fontSize: '14px',
                fontWeight: '500',
                marginRight: '15px'
              }}
            >
              ← Volver
            </button>
            <h2 style={{ 
              color: 'white', 
              margin: 0, 
              fontSize: isMobile ? '1.5em' : '1.8em',
              fontWeight: '600'
            }}>
              Chat con Juan Pablo 💬
            </h2>
          </div>
          
          {/* Messages Area */}
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
                wordWrap: 'break-word',
                fontSize: '15px',
                lineHeight: '1.5',
                border: msg.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.2)',
                position: 'relative'
              }}>
                <div style={{ 
                  fontSize: '0.8em', 
                  fontWeight: '600', 
                  marginBottom: '8px', 
                  opacity: 0.8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>{msg.sender === 'user' ? 'Tú' : 'Juan Pablo'}</span>
                  {msg.sender === 'juan' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {/* Speak Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakMessage(msg.text, index);
                        }}
                        style={{
                          background: speakingMessageId === index ? 'rgba(0,255,0,0.2)' : 'rgba(255,255,255,0.1)',
                          border: speakingMessageId === index ? '1px solid rgba(0,255,0,0.5)' : '1px solid rgba(255,255,255,0.3)',
                          color: speakingMessageId === index ? '#00ff00' : 'rgba(255,255,255,0.8)',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.9em',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          if (speakingMessageId !== index) {
                            e.target.style.background = 'rgba(255,255,255,0.2)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (speakingMessageId !== index) {
                            e.target.style.background = 'rgba(255,255,255,0.1)';
                          }
                        }}
                      >
                        {speakingMessageId === index ? '⏸️' : '🔊'} MX
                      </button>
                      
                      {/* Translate Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          translateMessage(msg.text, index);
                        }}
                        style={{
                          background: messageTranslations[index] ? 'rgba(0,150,255,0.2)' : 'rgba(255,255,255,0.1)',
                          border: messageTranslations[index] ? '1px solid rgba(0,150,255,0.5)' : '1px solid rgba(255,255,255,0.3)',
                          color: messageTranslations[index] ? '#0096ff' : 'rgba(255,255,255,0.8)',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.9em',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          if (!messageTranslations[index]) {
                            e.target.style.background = 'rgba(255,255,255,0.2)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!messageTranslations[index]) {
                            e.target.style.background = 'rgba(255,255,255,0.1)';
                          }
                        }}
                      >
                        {translatingMessageId === index ? '🔄' : '🇺🇸'} EN
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Original Spanish Text */}
                <div>{msg.text}</div>
                
                {/* English Translation */}
                {messageTranslations[index] && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontStyle: 'italic',
                    color: 'rgba(255,255,255,0.9)',
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
                maxWidth: '80%',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                Juan Pablo está escribiendo...
              </div>
            )}
          </div>
          
          {/* Input Area */}
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
                fontSize: '15px',
                minHeight: '60px',
                maxHeight: '120px',
                fontFamily: 'inherit',
                color: 'white',
                outline: 'none'
              }}
              rows={2}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.6)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
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
                fontSize: '18px',
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
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
                fontSize: '14px',
                fontWeight: '600',
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

  // Learning Mode - Interactive CDMX Learning System
  if (currentMode === 'learning') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#000000',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <Head>
          <title>Juan Pablo - Lecciones CDMX</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        </Head>
        
        {/* Back Button */}
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
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            zIndex: 1000
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.2)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.1)';
          }}
        >
          ← Volver
        </button>

        <div style={{ padding: '80px 20px 20px 20px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            {!selectedModule ? (
              <>
                {/* Progress Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '25px',
                  borderRadius: '20px',
                  marginBottom: '30px',
                  color: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.8em', fontWeight: '700' }}>
                        ¡Hola! Preparándote para CDMX 🇲🇽
                      </h2>
                      <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '1.1em' }}>
                        Nivel {userProgress.level} • {userProgress.totalXP} XP Total
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '2em', marginBottom: '5px' }}>🔥</div>
                      <div style={{ fontSize: '1.2em', fontWeight: '600' }}>
                        {userProgress.currentStreak} días
                      </div>
                    </div>
                  </div>
                  
                  {/* Weekly Progress */}
                  <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '15px', padding: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontWeight: '600' }}>Meta semanal</span>
                      <span>{userProgress.weeklyXP}/{userProgress.weeklyGoal} XP</span>
                    </div>
                    <div style={{ 
                      background: 'rgba(255,255,255,0.3)', 
                      borderRadius: '10px', 
                      height: '12px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        background: '#00ff88',
                        height: '100%',
                        width: `${(userProgress.weeklyXP / userProgress.weeklyGoal) * 100}%`,
                        borderRadius: '10px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </div>

                {/* Learning Modules */}
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ 
                    color: 'white', 
                    fontSize: '1.5em', 
                    marginBottom: '20px',
                    fontWeight: '600'
                  }}>
                    📚 Módulos de Aprendizaje CDMX
                  </h3>
                  <p style={{ 
                    color: 'rgba(255,255,255,0.7)', 
                    fontSize: '1.1em',
                    lineHeight: '1.6',
                    marginBottom: '30px'
                  }}>
                    Aprende español específicamente para vivir en Ciudad de México. Cada módulo incluye situaciones reales, 
                    vocabulario práctico y contexto cultural mexicano.
                  </p>
                </div>

                {/* Interactive Module Cards */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                  gap: '25px',
                  marginBottom: '40px'
                }}>
                  {learningModules.map(module => (
                    <div 
                      key={module.id}
                      style={{
                        background: module.color,
                        borderRadius: '20px',
                        padding: '25px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        minHeight: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                      onClick={() => setSelectedModule(module)}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-8px)';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                      }}
                    >
                      {/* Progress indicator */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'rgba(255,255,255,0.3)'
                      }}>
                        <div style={{
                          background: '#00ff88',
                          height: '100%',
                          width: `${(module.completed / module.lessons) * 100}%`,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>

                      <div>
                        <div style={{ fontSize: '3em', marginBottom: '15px' }}>{module.icon}</div>
                        <h3 style={{ 
                          color: 'white', 
                          margin: '0 0 10px 0', 
                          fontSize: '1.4em', 
                          fontWeight: '700',
                          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}>
                          {module.title}
                        </h3>
                        <p style={{ 
                          color: 'rgba(255,255,255,0.9)', 
                          margin: '0 0 15px 0', 
                          lineHeight: '1.4',
                          fontSize: '0.95em'
                        }}>
                          {module.description}
                        </p>
                      </div>

                      <div>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          marginBottom: '10px',
                          fontSize: '0.9em',
                          color: 'rgba(255,255,255,0.8)'
                        }}>
                          <span>🎯 {module.difficulty}</span>
                          <span>⏱️ {module.estimatedTime}</span>
                        </div>
                        <div style={{
                          background: 'rgba(255,255,255,0.2)',
                          borderRadius: '20px',
                          padding: '8px 15px',
                          color: 'white',
                          fontWeight: '600',
                          textAlign: 'center',
                          fontSize: '0.9em'
                        }}>
                          {module.completed}/{module.lessons} lecciones • {Math.round((module.completed / module.lessons) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '20px'
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '15px',
                    padding: '20px',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ fontSize: '2em', marginBottom: '10px' }}>📈</div>
                    <div style={{ color: 'white', fontWeight: '600', fontSize: '1.1em' }}>
                      Progreso Global
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '2em', fontWeight: '700', margin: '10px 0' }}>
                      32%
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9em' }}>
                      Listo para CDMX en 8 semanas
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '15px',
                    padding: '20px',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ fontSize: '2em', marginBottom: '10px' }}>💪</div>
                    <div style={{ color: 'white', fontWeight: '600', fontSize: '1.1em' }}>
                      Nivel de Español
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.5em', fontWeight: '700', margin: '10px 0' }}>
                      Intermedio
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9em' }}>
                      Avanzando hacia Avanzado
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '15px',
                    padding: '20px',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ fontSize: '2em', marginBottom: '10px' }}>🎯</div>
                    <div style={{ color: 'white', fontWeight: '600', fontSize: '1.1em' }}>
                      Próximo Objetivo
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2em', fontWeight: '600', margin: '10px 0' }}>
                      Completar Transporte
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9em' }}>
                      4 lecciones restantes
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Module Detail View */
              <div style={{ padding: '20px 0' }}>
                <button 
                  onClick={() => setSelectedModule(null)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    marginBottom: '20px',
                    fontSize: '14px'
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
                  <h2 style={{ margin: '0 0 10px 0', fontSize: '2em', fontWeight: '700' }}>
                    {selectedModule.title}
                  </h2>
                  <p style={{ margin: '0', fontSize: '1.1em', opacity: 0.9 }}>
                    {selectedModule.description}
                  </p>
                  <div style={{ 
                    display: 'flex', 
                    gap: '20px', 
                    marginTop: '20px',
                    fontSize: '0.95em'
                  }}>
                    <span>📚 {selectedModule.lessons} lecciones</span>
                    <span>🎯 {selectedModule.difficulty}</span>
                    <span>⏱️ {selectedModule.estimatedTime}</span>
                  </div>
                </div>

                {/* Lesson List */}
                <div style={{ display: 'grid', gap: '15px' }}>
                  {transportLessons.map((lesson, index) => (
                    <div key={lesson.id} style={{
                      background: lesson.completed ? 'rgba(0,255,136,0.1)' : lesson.current ? 'rgba(255,193,7,0.1)' : 'rgba(255,255,255,0.05)',
                      border: lesson.current ? '2px solid #ffc107' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '15px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
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
                            {lesson.completed ? '✓' : lesson.current ? '▶' : lesson.id}
                          </div>
                          <div>
                            <h4 style={{ 
                              margin: 0, 
                              color: 'white', 
                              fontSize: '1.1em',
                              fontWeight: '600'
                            }}>
                              {lesson.title}
                            </h4>
                            <p style={{ 
                              margin: '5px 0 0 0', 
                              color: 'rgba(255,255,255,0.7)', 
                              fontSize: '0.9em'
                            }}>
                              {lesson.type === 'interactive' && '🎯 Práctica interactiva'}
                              {lesson.type === 'conversation' && '💬 Conversación'}
                              {lesson.type === 'vocabulary' && '📚 Vocabulario'}
                              {lesson.type === 'pronunciation' && '🔊 Pronunciación'}
                            </p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ 
                            color: '#ffc107', 
                            fontWeight: '600',
                            fontSize: '0.9em'
                          }}>
                            +{lesson.xpReward} XP
                          </div>
                          {lesson.current && (
                            <button style={{
                              background: '#ffc107',
                              color: '#000',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '20px',
                              fontSize: '0.8em',
                              fontWeight: '600',
                              marginTop: '5px',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              alert('¡Próximamente! Esta lección estará disponible pronto.');
                            }}
                            >
                              Continuar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
