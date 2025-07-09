import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function JuanPablo() {
  const [currentMode, setCurrentMode] = useState(null); // null, 'video', 'chat'
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListeningToPedro, setIsListeningToPedro] = useState(false);
  
  const recognitionRef = useRef(null);
  const pedroListenerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      // User voice input (converts to text for sending)
      recognitionRef.current = new webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-ES';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      // Pedro speech listener (captures his voice as text)
      pedroListenerRef.current = new webkitSpeechRecognition();
      pedroListenerRef.current.continuous = true;
      pedroListenerRef.current.interimResults = true;
      pedroListenerRef.current.lang = 'es-ES';
      
      let currentTranscript = '';
      let silenceTimer = null;
      
      pedroListenerRef.current.onresult = (event) => {
        // Combine all results to get the full transcript
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        
        currentTranscript = fullTranscript;
        
        // Clear the silence timer and start a new one
        if (silenceTimer) clearTimeout(silenceTimer);
        
        // Wait for 2 seconds of silence before finalizing
        silenceTimer = setTimeout(() => {
          if (currentTranscript.trim()) {
            console.log('🎤 Pedro said (complete):', currentTranscript);
            setMessages(prev => {
              // Avoid adding duplicate messages
              const lastMessage = prev[prev.length - 1];
              if (lastMessage && lastMessage.sender === 'juan' && 
                  lastMessage.text.includes(currentTranscript.substring(0, 20))) {
                return prev;
              }
              return [...prev, { text: currentTranscript.trim(), sender: 'juan' }];
            });
            currentTranscript = ''; // Reset for next response
          }
        }, 2000);
      };
      
      pedroListenerRef.current.onend = () => {
        if (isListeningToPedro) {
          // Auto-restart to keep listening
          setTimeout(() => {
            if (pedroListenerRef.current && isListeningToPedro) {
              pedroListenerRef.current.start();
            }
          }, 100);
        }
      };
    }
  }, [isListeningToPedro]);

  const startVideoMode = () => {
    setCurrentMode('video');
    setMessages([
      { text: "¡Hola! Habla conmigo directamente para practicar conversación. Haz clic en 'Escuchar' para ver mis respuestas como texto.", sender: 'juan' }
    ]);
    // Load HeyGen embed after a small delay to ensure DOM is ready
    setTimeout(() => {
      loadHeyGenEmbed();
    }, 100);
  };

  const startChatMode = () => {
    setCurrentMode('chat');
    setMessages([
      { text: "¡Hola! Soy Juan Pablo, tu profesor de español por texto. Escribe en español o inglés y te ayudo con gramática, vocabulario y preparación para Ciudad de México. ¿Cómo te llamas?", sender: 'juan' }
    ]);
  };

  const loadHeyGenEmbed = () => {
    console.log('🎬 Loading HeyGen embed...');
    
    // Remove existing embed if any
    const existingEmbed = document.getElementById('heygen-streaming-embed');
    if (existingEmbed) {
      existingEmbed.remove();
      console.log('🗑️ Removed existing embed');
    }

    // Wait for container to be available
    const avatarContainer = document.getElementById('avatar-video-container');
    if (!avatarContainer) {
      console.log('❌ Avatar container not found, retrying...');
      setTimeout(loadHeyGenEmbed, 200);
      return;
    }

    console.log('✅ Avatar container found, creating embed');

    // Create the HeyGen embed
    const host = "https://labs.heygen.com";
    const shareData = "eyJxdWFsaXR5IjoiaGlnaCIsImF2YXRhck5hbWUiOiJQZWRyb19Qcm9mZXNzaW9uYWxMb29rMl9wdWJsaWMiLCJwcmV2aWV3SW1nIjoiaHR0cHM6Ly9maWxlczIuaGV5Z2VuLmFpL2F2YXRhci92My9mOWM5NGFlN2JkMTU0NWU4YjY1MzFhOTFiYTk3NmFkOV81NTkxMC9wcmV2aWV3X3RhbGtfMS53ZWJwIiwibmVlZFJlbW92ZUJhY2tncm91bmQiOnRydWUsImtub3dsZWRnZUJhc2VJZCI6ImE0MjZkNGFjYWUzMTQ0MTI4NWZkMGViZjk3YTU2ZjA3IiwidXNlcm5hbWUiOiI4NjE0MmI4MzMyM2Q0YmY0YmFlMmM5OTFmYWFmZmE5YyJ9";
    const url = host + "/guest/streaming-embed?share=" + shareData + "&inIFrame=1";
    
    const wrapDiv = document.createElement("div");
    wrapDiv.id = "heygen-streaming-embed";
    
    const container = document.createElement("div");
    container.id = "heygen-streaming-container";
    
    const stylesheet = document.createElement("style");
    stylesheet.innerHTML = `
      #heygen-streaming-embed {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 15px;
        overflow: hidden;
        z-index: 10;
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
    iframe.title = "Pedro - Video Spanish Practice";
    iframe.allow = "microphone";
    iframe.src = url;
    
    // Add load event listener
    iframe.onload = () => {
      console.log('✅ HeyGen iframe loaded successfully');
      // Hide the placeholder text
      const placeholder = avatarContainer.querySelector('div[style*="position: absolute"]');
      if (placeholder) {
        placeholder.style.display = 'none';
      }
    };
    
    iframe.onerror = (error) => {
      console.error('❌ HeyGen iframe error:', error);
    };
    
    container.appendChild(iframe);
    wrapDiv.appendChild(stylesheet);
    wrapDiv.appendChild(container);
    
    avatarContainer.appendChild(wrapDiv);
    console.log('🎬 HeyGen embed created and added to container');
  };

  const handleSendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { text: message, sender: 'user' }]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get response from Together.ai
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message
        }),
      });

      const chatData = await chatResponse.json();
      setMessages(prev => [...prev, { text: chatData.reply, sender: 'juan' }]);

    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, { 
        text: 'Lo siento, tuve un problema técnico. ¿Puedes repetir?', 
        sender: 'juan' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert('El reconocimiento de voz no está disponible en este navegador. Prueba Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const startListeningToPedro = () => {
    if (pedroListenerRef.current && !isListeningToPedro) {
      setIsListeningToPedro(true);
      pedroListenerRef.current.start();
      console.log('👂 Started listening to Pedro...');
    }
  };

  const stopListeningToPedro = () => {
    if (pedroListenerRef.current && isListeningToPedro) {
      pedroListenerRef.current.stop();
      setIsListeningToPedro(false);
      console.log('🔇 Stopped listening to Pedro');
    }
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

  // Intro Screen with Sizzle Reel
  if (!currentMode && !showModeSelection) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', position: 'relative', overflow: 'hidden' }}>
        <Head>
          <title>Juan Pablo - Spanish Tutor</title>
          <meta name="description" content="AI Spanish tutor for Mexico City preparation" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>
        
        {/* Sizzle Reel Video */}
        <video 
          ref={videoRef}
          autoPlay 
          muted 
          playsInline
          onEnded={handleVideoEnd}
          style={{ 
            width: '100%', 
            height: '100vh', 
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1
          }}
        >
          <source src="/intro-sizzle.mp4" type="video/mp4" />
          Su navegador no soporta el elemento de video.
        </video>

        {/* Skip Button - Responsive */}
        <button
          onClick={skipIntro}
          style={{
            position: 'absolute',
            top: 'max(20px, env(safe-area-inset-top))',
            right: 'max(20px, env(safe-area-inset-right))',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '12px',
            zIndex: 10,
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.background = 'rgba(0, 0, 0, 0.9)'}
          onMouseOut={(e) => e.target.style.background = 'rgba(0, 0, 0, 0.7)'}
        >
          Saltar →
        </button>

        {/* Loading indicator - Responsive */}
        <div style={{
          position: 'absolute',
          bottom: 'max(30px, env(safe-area-inset-bottom))',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          textAlign: 'center',
          zIndex: 10,
          padding: '0 20px'
        }}>
          <div style={{ fontSize: '1em', marginBottom: '10px' }}>🇲🇽 Juan Pablo</div>
          <div style={{ opacity: 0.8, fontSize: '0.9em' }}>Cargando tu experiencia de español...</div>
        </div>
      </div>
    );
  }

  // Mode Selection Screen  
  if (!currentMode) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Head>
          <title>Juan Pablo - Spanish Tutor</title>
          <meta name="description" content="AI Spanish tutor for Mexico City preparation" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>
        
        <div style={{ 
          background: 'white', 
          borderRadius: '20px', 
          padding: '40px 20px', 
          maxWidth: '800px', 
          width: '100%', 
          textAlign: 'center', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)', 
          animation: 'fadeInUp 0.8s ease-out',
          margin: '20px'
        }}>
          <h1 style={{ 
            fontSize: '2em', 
            margin: '0 0 20px 0', 
            color: '#333',
            lineHeight: '1.2'
          }}>🇲🇽 Juan Pablo</h1>
          <p style={{ 
            fontSize: '1.1em', 
            color: '#666', 
            margin: '0 0 30px 0',
            lineHeight: '1.4'
          }}>Tu profesor de español para Ciudad de México</p>
          
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            justifyContent: 'center', 
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            {/* Video Mode */}
            <div 
              onClick={startVideoMode}
              style={{ 
                background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)', 
                color: 'white', 
                padding: '30px 20px', 
                borderRadius: '20px', 
                cursor: 'pointer', 
                width: '100%',
                maxWidth: '400px',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 30px rgba(255, 107, 107, 0.3)',
                animation: 'slideInLeft 0.6s ease-out 0.3s both'
              }}
            >
              <div style={{ fontSize: '2.5em', marginBottom: '15px' }}>🎥</div>
              <h2 style={{ fontSize: '1.3em', margin: '0 0 15px 0' }}>Conversación en Video</h2>
              <p style={{ opacity: 0.9, lineHeight: '1.5', margin: 0, fontSize: '0.9em' }}>
                Habla directamente con Pedro para practicar pronunciación y comprensión oral. 
                Ve sus respuestas como texto para aprender escritura.
              </p>
            </div>

            {/* Chat Mode */}
            <div 
              onClick={startChatMode}
              style={{ 
                background: 'linear-gradient(135deg, #667eea, #764ba2)', 
                color: 'white', 
                padding: '30px 20px', 
                borderRadius: '20px', 
                cursor: 'pointer', 
                width: '100%',
                maxWidth: '400px',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                animation: 'slideInRight 0.6s ease-out 0.5s both'
              }}
            >
              <div style={{ fontSize: '2.5em', marginBottom: '15px' }}>💬</div>
              <h2 style={{ fontSize: '1.3em', margin: '0 0 15px 0' }}>Chat de Texto</h2>
              <p style={{ opacity: 0.9, lineHeight: '1.5', margin: 0, fontSize: '0.9em' }}>
                Conversa por texto con Juan Pablo. Practica gramática, vocabulario 
                y recibe correcciones detalladas para Ciudad de México.
              </p>
            </div>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-50px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(50px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>
      </div>
    );
  }

  // Video Mode
  if (currentMode === 'video') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)', padding: '10px' }}>
        <Head>
          <title>Juan Pablo - Video Mode</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'white', borderRadius: '20px', minHeight: '95vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          
          <div style={{ background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)', color: 'white', padding: '15px', display: 'flex', alignItems: 'center', borderRadius: '20px 20px 0 0', flexWrap: 'wrap', gap: '10px' }}>
            <button 
              onClick={goBack}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '15px', cursor: 'pointer' }}
            >
              ← Volver
            </button>
            <div style={{ flex: 1, textAlign: 'center', minWidth: '200px' }}>
              <h1 style={{ fontSize: '1.3em', margin: 0 }}>🎥 Video con Pedro</h1>
              <div style={{ opacity: 0.9, marginTop: '5px', fontSize: '0.9em' }}>
                {isListeningToPedro ? '👂 Escuchando respuestas...' : 'Habla con Pedro directamente'}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: window.innerWidth <= 768 ? 'column' : 'row' }}>
            {/* Video section */}
            <div style={{ flex: window.innerWidth <= 768 ? 'none' : 2, background: '#f8f9fa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div 
                id="avatar-video-container"
                style={{ 
                  width: window.innerWidth <= 768 ? '100%' : '400px', 
                  height: window.innerWidth <= 768 ? '250px' : '300px', 
                  maxWidth: '400px',
                  background: '#000', 
                  borderRadius: '15px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  marginBottom: '20px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ textAlign: 'center', position: 'absolute', zIndex: 5, background: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '1.2em', marginBottom: '5px' }}>👋 ¡Hola! Soy Pedro</div>
                  <div style={{ fontSize: '0.9em', opacity: 0.8 }}>Conectando video...</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={startListeningToPedro}
                  disabled={isListeningToPedro}
                  style={{ 
                    padding: '12px 20px', 
                    background: isListeningToPedro ? '#4caf50' : '#007bff', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '25px', 
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isListeningToPedro ? '👂 Escuchando...' : '👂 Escuchar a Pedro'}
                </button>
                {isListeningToPedro && (
                  <button
                    onClick={stopListeningToPedro}
                    style={{ 
                      padding: '12px 20px', 
                      background: '#dc3545', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '25px', 
                      cursor: 'pointer',
                      fontSize: '0.9em'
                    }}
                  >
                    ⏹️ Parar
                  </button>
                )}
              </div>
              
              <div style={{ marginTop: '15px', textAlign: 'center', maxWidth: '350px' }}>
                <p style={{ color: '#666', fontSize: '0.9em', lineHeight: '1.4', margin: 0 }}>
                  {isListeningToPedro ? 
                    '👂 Escuchando a Pedro - sus palabras aparecerán como texto →' :
                    'Habla con Pedro y haz clic en "Escuchar" para ver sus respuestas como texto'
                  }
                </p>
              </div>
            </div>

            {/* Transcript section */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderLeft: window.innerWidth <= 768 ? 'none' : '2px solid #e9ecef', borderTop: window.innerWidth <= 768 ? '2px solid #e9ecef' : 'none' }}>
              <div style={{ padding: '15px', background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
                <h3 style={{ color: '#333', margin: '0 0 5px 0', fontSize: '1.1em' }}>📝 Transcripción</h3>
                <p style={{ color: '#666', fontSize: '0.85em', margin: 0 }}>
                  Las palabras de Pedro aparecen aquí
                </p>
              </div>
              
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: 'white', minHeight: window.innerWidth <= 768 ? '200px' : 'auto' }}>
                {messages.map((msg, index) => (
                  <div key={index} style={{ marginBottom: '15px' }}>
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: '#f1f3f4',
                      color: '#333',
                      lineHeight: '1.4',
                      fontSize: '0.95em',
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{ fontSize: '0.8em', color: '#666', marginBottom: '5px' }}>
                        Pedro dice:
                      </div>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {messages.length === 1 && (
                  <div style={{ textAlign: 'center', color: '#999', fontStyle: 'italic', marginTop: '50px' }}>
                    Las respuestas de Pedro aparecerán aquí cuando actives "Escuchar"
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat Mode
  if (currentMode === 'chat') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: '10px' }}>
        <Head>
          <title>Juan Pablo - Chat Mode</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>
        
        <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '20px', minHeight: '95vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          
          <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', padding: '15px', display: 'flex', alignItems: 'center', borderRadius: '20px 20px 0 0', flexWrap: 'wrap', gap: '10px' }}>
            <button 
              onClick={goBack}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '15px', cursor: 'pointer' }}
            >
              ← Volver
            </button>
            <div style={{ flex: 1, textAlign: 'center', minWidth: '200px' }}>
              <h1 style={{ fontSize: '1.3em', margin: 0 }}>💬 Chat con Juan Pablo</h1>
              <div style={{ opacity: 0.9, marginTop: '5px', fontSize: '0.9em' }}>
                Práctica de texto, gramática y vocabulario
              </div>
            </div>
          </div>

          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#f8f9fa' }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ marginBottom: '15px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                <div style={{
                  display: 'inline-block',
                  maxWidth: '80%',
                  padding: '12px 18px',
                  borderRadius: '18px',
                  background: msg.sender === 'user' ? '#667eea' : 'white',
                  color: msg.sender === 'user' ? 'white' : '#333',
                  border: msg.sender === 'juan' ? '1px solid #e9ecef' : 'none',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  lineHeight: '1.4'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ textAlign: 'left', marginBottom: '15px' }}>
                <div style={{ display: 'inline-block', padding: '12px 18px', background: 'white', border: '1px solid #e9ecef', borderRadius: '18px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                  <span style={{ opacity: 0.7 }}>Juan Pablo está escribiendo...</span>
                </div>
              </div>
            )}
          </div>
          
          <div style={{ padding: '20px', background: 'white', borderTop: '2px solid #e9ecef' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                placeholder="Escribe en español o inglés..."
                disabled={isLoading}
                style={{ 
                  flex: 1, 
                  minWidth: '200px',
                  padding: '12px 18px', 
                  border: '2px solid #e9ecef', 
                  borderRadius: '25px', 
                  fontSize: '16px', 
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
              />
              <button
                onClick={toggleVoice}
                style={{
                  width: '45px',
                  height: '45px',
                  borderRadius: '50%',
                  border: 'none',
                  background: isListening ? '#4caf50' : '#ff6b6b',
                  color: 'white',
                  fontSize: '18px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: isListening ? 'scale(1.1)' : 'scale(1)'
                }}
                title="Convierte tu voz a texto"
              >
                🎤
              </button>
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputMessage.trim()}
                style={{ 
                  padding: '12px 20px', 
                  background: isLoading || !inputMessage.trim() ? '#ccc' : '#667eea', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '25px', 
                  cursor: isLoading || !inputMessage.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '14px'
                }}
              >
                {isLoading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
