import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function JuanPablo() {
  const [currentMode, setCurrentMode] = useState(null); // null, 'video', 'chat'
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [isListeningToPedro, setIsListeningToPedro] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const recognitionRef = useRef(null);
  const pedroListenerRef = useRef(null);
  const videoRef = useRef(null);

  // Proper mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const startVideoMode = () => {
    setCurrentMode('video');
    setMessages([
      { text: "¡Hola! Habla conmigo directamente para practicar conversación. Haz clic en 'Escuchar' para ver mis respuestas como texto.", sender: 'juan' }
    ]);
    setTimeout(loadHeyGenEmbed, 1000);
  };

  const startChatMode = () => {
    setCurrentMode('chat');
    setMessages([
      { text: "¡Hola! Soy Juan Pablo, tu profesor de español. Estoy aquí para ayudarte a prepararte para tu mudanza a Ciudad de México. ¿En qué te gustaría practicar hoy?", sender: 'juan' }
    ]);
  };

  const goBack = () => {
    setCurrentMode(null);
    setShowModeSelection(false);
    setMessages([]);
    stopListeningToPedro();
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

      // Pedro speech listener (captures his voice as text)
      pedroListenerRef.current = new webkitSpeechRecognition();
      pedroListenerRef.current.continuous = true;
      pedroListenerRef.current.interimResults = true;
      pedroListenerRef.current.lang = 'es-MX'; // Mexican Spanish
      
      let sentenceTimer;
      let currentSentence = '';
      let isProcessing = false;
      
      pedroListenerRef.current.onstart = () => {
        console.log('🎙️ Pedro listener started successfully');
        console.log('🔊 Listening for complete sentences from Pedro...');
      };
      
      pedroListenerRef.current.onresult = (event) => {
        console.log('🎙️ Pedro speech detected! Event:', event);
        
        // Build complete transcript from all results
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        
        const cleanTranscript = fullTranscript.trim();
        console.log('📝 Full transcript so far:', cleanTranscript);
        
        // Update current sentence
        currentSentence = cleanTranscript;
        
        // Clear existing timer
        if (sentenceTimer) clearTimeout(sentenceTimer);
        
        // Wait for sentence to complete (4 seconds of silence)
        sentenceTimer = setTimeout(() => {
          if (!isProcessing && currentSentence.trim().length > 3) {
            isProcessing = true;
            console.log('✅ Adding complete Pedro sentence:', currentSentence);
            
            const newMessage = { 
              text: currentSentence.trim(), 
              sender: 'juan',
              timestamp: new Date().toLocaleTimeString()
            };
            
            setMessages(prev => {
              const updated = [...prev, newMessage];
              console.log('📝 Updated messages with complete sentence');
              return updated;
            });
            
            // Reset for next sentence
            currentSentence = '';
            
            // Reset processing flag
            setTimeout(() => {
              isProcessing = false;
              console.log('🔄 Ready for next sentence');
            }, 1000);
          }
        }, 4000); // Wait 4 seconds for complete sentence
      };
      
      pedroListenerRef.current.onerror = (event) => {
        console.error('❌ Pedro listener error:', event.error);
        console.error('❌ Full error event:', event);
        
        setIsListeningToPedro(false);
        
        // Show specific error messages to user
        let errorMessage = "❌ Error de transcripción: ";
        switch(event.error) {
          case 'not-allowed':
            errorMessage += "Permisos de micrófono denegados. Por favor, permite el acceso al micrófono.";
            break;
          case 'no-speech':
            errorMessage += "No se detectó habla. El micrófono puede no estar captando el audio de Pedro. Usa el botón 'Añadir Manualmente' como alternativa.";
            break;
          case 'audio-capture':
            errorMessage += "Error de captura de audio. Verifica tu micrófono o usa la opción manual.";
            break;
          case 'network':
            errorMessage += "Error de red. Verifica tu conexión a internet.";
            break;
          default:
            errorMessage += event.error + ". Usa la opción 'Añadir Manualmente' si Pedro está hablando.";
        }
        
        setMessages(prev => [...prev, { 
          text: errorMessage, 
          sender: 'system',
          timestamp: new Date().toLocaleTimeString()
        }]);
        
        // Don't auto-restart after no-speech error
        if (event.error !== 'not-allowed' && event.error !== 'no-speech') {
          setTimeout(() => {
            if (currentMode === 'video') {
              console.log('🔄 Attempting to restart Pedro listener...');
              try {
                startListeningToPedro();
              } catch (e) {
                console.error('Failed to restart Pedro listener:', e);
              }
            }
          }, 3000);
        }
      };
      
      pedroListenerRef.current.onend = () => {
        console.log('🔄 Pedro listener ended, restarting...');
        if (isListeningToPedro) {
          setTimeout(() => {
            try {
              pedroListenerRef.current.start();
              console.log('🔄 Restarted Pedro listener');
            } catch (e) {
              console.error('Failed to restart Pedro listener:', e);
              setIsListeningToPedro(false);
            }
          }, 500);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (pedroListenerRef.current) {
        pedroListenerRef.current.stop();
      }
    };
  }, []);

  const startListeningToPedro = () => {
    if (!pedroListenerRef.current) {
      console.error('❌ Pedro listener not initialized');
      return;
    }
    
    if (isListeningToPedro) {
      console.log('⚠️ Already listening to Pedro');
      return;
    }
    
    try {
      setIsListeningToPedro(true);
      pedroListenerRef.current.start();
      console.log('👂 Started listening to Pedro...');
      
      // Add visual feedback
      setMessages(prev => [...prev, { 
        text: "🎙️ Escuchando a Pedro... (Habla con él para ver la transcripción)", 
        sender: 'system',
        timestamp: new Date().toLocaleTimeString()
      }]);
      
    } catch (e) {
      console.error('❌ Failed to start Pedro listener:', e);
      setIsListeningToPedro(false);
      
      // Show error to user
      setMessages(prev => [...prev, { 
        text: "❌ Error: No se pudo activar la escucha. Verifica los permisos del micrófono.", 
        sender: 'system',
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  const stopListeningToPedro = () => {
    if (pedroListenerRef.current && isListeningToPedro) {
      pedroListenerRef.current.stop();
      setIsListeningToPedro(false);
      console.log('🛑 Stopped listening to Pedro');
    }
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
        body: JSON.stringify({ message: inputMessage })
      });

      const data = await response.json();
      
      if (data.response) {
        setMessages(prev => [...prev, { text: data.response, sender: 'juan' }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { text: "Lo siento, hubo un error. ¿Puedes intentar de nuevo?", sender: 'juan' }]);
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
        zIndex: 9999
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
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: isMobile ? 'contain' : 'cover'
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

  // Mode Selection Screen  
  if (!currentMode) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        width: '100vw',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        position: 'fixed',
        top: 0,
        left: 0,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        zIndex: 1000,
        overflow: 'auto'
      }}>
        <Head>
          <title>Juan Pablo - Choose Your Learning Style</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        </Head>
        
        <div style={{ 
          maxWidth: '1200px', 
          width: '100%', 
          textAlign: 'center'
        }}>
          {/* Hero Section */}
          <div style={{ marginBottom: '60px' }}>
            <h1 style={{ 
              fontSize: isMobile ? '3em' : '4.5em', 
              marginBottom: '20px', 
              color: 'white', 
              fontWeight: '900',
              lineHeight: '1.1',
              textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              letterSpacing: '-0.02em'
            }}>
              ¡Hola! Soy Juan Pablo 🇲🇽
            </h1>
            <p style={{ 
              fontSize: isMobile ? '1.2em' : '1.5em', 
              color: 'rgba(255,255,255,0.9)', 
              fontWeight: '400',
              lineHeight: '1.6',
              maxWidth: '600px',
              margin: '0 auto',
              textShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}>
              Tu compañero de español para prepararte para Ciudad de México
            </p>
          </div>
          
          {/* Mode Cards */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? '30px' : '40px',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {/* Video Mode Card */}
            <div 
              onClick={startVideoMode}
              style={{ 
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)', 
                borderRadius: '24px',
                padding: isMobile ? '40px 30px' : '50px 40px',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                boxShadow: '0 20px 40px rgba(255, 107, 107, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                border: 'none',
                touchAction: 'manipulation'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-8px) scale(1.02)';
                e.target.style.boxShadow = '0 30px 60px rgba(255, 107, 107, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 20px 40px rgba(255, 107, 107, 0.3)';
              }}
              onTouchStart={(e) => {
                e.target.style.transform = 'translateY(-4px) scale(1.01)';
              }}
              onTouchEnd={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
              }}
            >
              {/* Animated background effect */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
                transform: 'rotate(45deg)',
                animation: 'shimmer 3s infinite',
                pointerEvents: 'none'
              }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ 
                  fontSize: isMobile ? '3.5em' : '4em', 
                  marginBottom: '20px',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                }}>
                  🎥
                </div>
                <h3 style={{ 
                  fontSize: isMobile ? '1.6em' : '2em', 
                  marginBottom: '15px', 
                  fontWeight: '700',
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  Video Conversación
                </h3>
                <p style={{ 
                  fontSize: isMobile ? '1em' : '1.1em', 
                  opacity: 0.95, 
                  lineHeight: '1.5',
                  color: 'white',
                  fontWeight: '400'
                }}>
                  Habla directamente con Pedro para practicar pronunciación y conversación natural
                </p>
                
                {/* Feature badges */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '10px', 
                  marginTop: '20px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8em',
                    fontWeight: '600',
                    color: 'white'
                  }}>
                    Pronunciación
                  </span>
                  <span style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8em',
                    fontWeight: '600',
                    color: 'white'
                  }}>
                    Tiempo Real
                  </span>
                </div>
              </div>
            </div>
            
            {/* Chat Mode Card */}
            <div 
              onClick={startChatMode}
              style={{ 
                background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)', 
                borderRadius: '24px',
                padding: isMobile ? '40px 30px' : '50px 40px',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                boxShadow: '0 20px 40px rgba(116, 185, 255, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                border: 'none',
                touchAction: 'manipulation'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-8px) scale(1.02)';
                e.target.style.boxShadow = '0 30px 60px rgba(116, 185, 255, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 20px 40px rgba(116, 185, 255, 0.3)';
              }}
              onTouchStart={(e) => {
                e.target.style.transform = 'translateY(-4px) scale(1.01)';
              }}
              onTouchEnd={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
              }}
            >
              {/* Animated background effect */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
                transform: 'rotate(45deg)',
                animation: 'shimmer 3s infinite 1.5s',
                pointerEvents: 'none'
              }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ 
                  fontSize: isMobile ? '3.5em' : '4em', 
                  marginBottom: '20px',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                }}>
                  💬
                </div>
                <h3 style={{ 
                  fontSize: isMobile ? '1.6em' : '2em', 
                  marginBottom: '15px', 
                  fontWeight: '700',
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  Chat Texto
                </h3>
                <p style={{ 
                  fontSize: isMobile ? '1em' : '1.1em', 
                  opacity: 0.95, 
                  lineHeight: '1.5',
                  color: 'white',
                  fontWeight: '400'
                }}>
                  Practica gramática, vocabulario y escritura con correcciones detalladas
                </p>
                
                {/* Feature badges */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '10px', 
                  marginTop: '20px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8em',
                    fontWeight: '600',
                    color: 'white'
                  }}>
                    Gramática
                  </span>
                  <span style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8em',
                    fontWeight: '600',
                    color: 'white'
                  }}>
                    Correcciones
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom CTA */}
          <div style={{ 
            marginTop: '50px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <p style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: isMobile ? '0.9em' : '1em',
              fontStyle: 'italic'
            }}>
              Preparándote para México • Septiembre 2024
            </p>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%) rotate(45deg); }
            100% { transform: translateX(100%) rotate(45deg); }
          }
        `}</style>
      </div>
    );
  }

  // Video Mode
  if (currentMode === 'video') {
    const [translatorInput, setTranslatorInput] = useState('');
    const [translatorOutput, setTranslatorOutput] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);

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
            gridTemplateColumns: '1fr 1fr',
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

  // Chat Mode
  if (currentMode === 'chat') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)', 
        padding: typeof window !== 'undefined' && window.innerWidth <= 768 ? '10px' : '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Head>
          <title>Juan Pablo - Chat Texto</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        </Head>
        
        <div style={{ 
          background: 'white', 
          borderRadius: '20px', 
          padding: typeof window !== 'undefined' && window.innerWidth <= 768 ? '15px' : '30px',
          width: '100%',
          maxWidth: '800px',
          height: typeof window !== 'undefined' && window.innerWidth <= 768 ? '90vh' : '80vh',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <button
              onClick={goBack}
              style={{
                background: 'rgba(116,185,255,0.2)',
                border: 'none',
                color: '#0984e3',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                marginRight: '15px'
              }}
            >
              ← Volver
            </button>
            <h2 style={{ color: '#333', margin: 0, fontSize: typeof window !== 'undefined' && window.innerWidth <= 768 ? '1.5em' : '2em' }}>
              Chat con Juan Pablo 💬
            </h2>
          </div>
          
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            marginBottom: '20px',
            padding: '15px',
            background: '#f8f9fa',
            borderRadius: '15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ 
                padding: '15px 20px',
                borderRadius: '15px',
                background: msg.sender === 'user' ? '#74b9ff' : '#e9ecef',
                color: msg.sender === 'user' ? 'white' : '#333',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                wordWrap: 'break-word',
                fontSize: typeof window !== 'undefined' && window.innerWidth <= 768 ? '14px' : '16px',
                lineHeight: '1.5'
              }}>
                <div style={{ fontSize: '0.8em', fontWeight: 'bold', marginBottom: '8px', opacity: 0.8 }}>
                  {msg.sender === 'user' ? 'Tú' : 'Juan Pablo'}
                </div>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div style={{ 
                padding: '15px 20px',
                borderRadius: '15px',
                background: '#e9ecef',
                color: '#666',
                fontStyle: 'italic',
                alignSelf: 'flex-start',
                maxWidth: '85%'
              }}>
                Juan Pablo está escribiendo...
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje en español o inglés..."
              style={{
                flex: 1,
                padding: '15px',
                border: '2px solid #e9ecef',
                borderRadius: '15px',
                resize: 'none',
                fontSize: typeof window !== 'undefined' && window.innerWidth <= 768 ? '14px' : '16px',
                minHeight: typeof window !== 'undefined' && window.innerWidth <= 768 ? '50px' : '60px',
                maxHeight: '120px',
                fontFamily: 'inherit'
              }}
              rows={typeof window !== 'undefined' && window.innerWidth <= 768 ? 2 : 3}
            />
            <button
              onClick={startVoiceInput}
              disabled={isLoading}
              style={{
                padding: typeof window !== 'undefined' && window.innerWidth <= 768 ? '12px' : '15px',
                background: '#74b9ff',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                cursor: 'pointer',
                fontSize: typeof window !== 'undefined' && window.innerWidth <= 768 ? '16px' : '18px',
                minWidth: typeof window !== 'undefined' && window.innerWidth <= 768 ? '50px' : '60px',
                height: typeof window !== 'undefined' && window.innerWidth <= 768 ? '50px' : '60px'
              }}
            >
              🎙️
            </button>
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              style={{
                padding: typeof window !== 'undefined' && window.innerWidth <= 768 ? '12px 20px' : '15px 25px',
                background: inputMessage.trim() ? '#0984e3' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '15px',
                cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
                fontSize: typeof window !== 'undefined' && window.innerWidth <= 768 ? '14px' : '16px',
                fontWeight: 'bold',
                height: typeof window !== 'undefined' && window.innerWidth <= 768 ? '50px' : '60px'
              }}
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
