import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function JuanPablo() {
  const [messages, setMessages] = useState([
    {
      text: "¡Hola! Soy Juan Pablo, tu profesor de español. Estoy aquí para ayudarte a prepararte para tu mudanza a Ciudad de México. ¿Cómo te llamas?",
      sender: 'juan'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  
  const recognitionRef = useRef(null);
  const avatarIframeRef = useRef(null);

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognitionRef.current = new webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-ES';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        handleSendMessage(transcript);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Load HeyGen embed and set up communication
    loadHeyGenEmbed();

    // Listen for messages from HeyGen embed
    const handleMessage = (event) => {
      // Log ALL messages to debug
      console.log('📨 Received message:', event.origin, event.data);
      
      if (event.origin === 'https://labs.heygen.com' && event.data) {
        
        // Handle different message formats
        if (event.data.type === 'streaming-embed') {
          console.log('🎭 HeyGen streaming message:', event.data);
          
          if (event.data.action === 'init') {
            setAvatarLoaded(true);
            console.log('✅ HeyGen avatar initialized');
            
          } else if (event.data.action === 'avatar_start_talking') {
            setIsAvatarSpeaking(true);
            console.log('🗣️ Avatar started speaking');
            
          } else if (event.data.action === 'avatar_stop_talking') {
            setIsAvatarSpeaking(false);
            console.log('🤐 Avatar stopped speaking');
            
          } else if (event.data.action === 'user_start_talking') {
            console.log('🎤 User started talking');
            
          } else if (event.data.action === 'user_stop_talking') {
            console.log('🔇 User stopped talking');
          }
        }
        
        // Check for text content in various formats
        if (event.data.text) {
          console.log('💬 Found text in message:', event.data.text);
          
          // Add to chat if it's an avatar response
          if (event.data.sender === 'avatar' || event.data.type === 'avatar_message') {
            setMessages(prev => [...prev, { text: event.data.text, sender: 'juan' }]);
          } else if (event.data.sender === 'user' || event.data.type === 'user_message') {
            setMessages(prev => [...prev, { text: event.data.text, sender: 'user' }]);
          } else {
            // Default to avatar message if unclear
            setMessages(prev => [...prev, { text: event.data.text, sender: 'juan' }]);
          }
        }
        
        // Check for message content
        if (event.data.message) {
          console.log('💬 Found message content:', event.data.message);
          setMessages(prev => [...prev, { text: event.data.message, sender: 'juan' }]);
        }
        
        // Check for response content
        if (event.data.response) {
          console.log('💬 Found response content:', event.data.response);
          setMessages(prev => [...prev, { text: event.data.response, sender: 'juan' }]);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const loadHeyGenEmbed = () => {
    // Remove existing embed if any
    const existingEmbed = document.getElementById('heygen-streaming-embed');
    if (existingEmbed) {
      existingEmbed.remove();
    }

    // Create the HeyGen embed
    const host = "https://labs.heygen.com";
    const url = host + "/guest/streaming-embed?share=eyJxdWFsaXR5IjoiaGlnaCIsImF2YXRhck5hbWUiOiJQZWRyb19Qcm9mZXNzaW9uYWxMb29rMl9w%0D%0AdWJsaWMiLCJwcmV2aWV3SW1nIjoiaHR0cHM6Ly9maWxlczIuaGV5Z2VuLmFpL2F2YXRhci92My9m%0D%0AOWM5NGFlN2JkMTU0NWU4YjY1MzFhOTFiYTk3NmFkOV81NTkxMC9wcmV2aWV3X3RhbGtfMS53ZWJw%0D%0AIiwibmVlZFJlbW92ZUJhY2tncm91bmQiOnRydWUsImtub3dsZWRnZUJhc2VJZCI6ImE0MjZkNGFj%0D%0AYWUzMTQ0MTI4NWZkMGViZjk3YTU2ZjA3IiwidXNlcm5hbWUiOiI4NjE0MmI4MzMyM2Q0YmY0YmFl%0D%0AMmM5OTFmYWFmZmE5YyJ9&inIFrame=1";
    
    const clientWidth = document.body.clientWidth;
    const wrapDiv = document.createElement("div");
    wrapDiv.id = "heygen-streaming-embed";
    
    const container = document.createElement("div");
    container.id = "heygen-streaming-container";
    
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
        opacity: 0;
        visibility: hidden;
        transition: all linear 0.3s;
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
    iframe.title = "Juan Pablo Avatar";
    iframe.role = "dialog";
    iframe.allow = "microphone";
    iframe.src = url;
    
    // Store reference to iframe
    avatarIframeRef.current = iframe;
    
    container.appendChild(iframe);
    wrapDiv.appendChild(stylesheet);
    wrapDiv.appendChild(container);
    
    // Add to avatar container
    const avatarContainer = document.getElementById('avatar-video-container');
    if (avatarContainer) {
      avatarContainer.appendChild(wrapDiv);
    }

    // Show the embed after a short delay
    setTimeout(() => {
      wrapDiv.classList.add('show');
    }, 1000);
  };

  const sendMessageToAvatar = (message) => {
    if (avatarIframeRef.current && avatarLoaded) {
      // Send message to HeyGen avatar
      avatarIframeRef.current.contentWindow.postMessage({
        type: 'streaming-embed',
        action: 'chat',
        message: message
      }, 'https://labs.heygen.com');
      
      console.log('📤 Sent to avatar:', message);
    }
  };

  const handleSendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;

    // Add user message to chat immediately
    setMessages(prev => [...prev, { text: message, sender: 'user' }]);
    setInputMessage('');
    setIsLoading(true);

    try {
      if (avatarLoaded) {
        // Send directly to HeyGen avatar - it will handle the response
        sendMessageToAvatar(message);
        
        // Show loading state
        setTimeout(() => setIsLoading(false), 1000);
        
      } else {
        // Fallback to our Together.ai if avatar not loaded
        const chatResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message
          }),
        });

        const chatData = await chatResponse.json();
        setMessages(prev => [...prev, { text: chatData.reply, sender: 'juan' }]);
        setIsLoading(false);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, { 
        text: 'Lo siento, tuve un problema técnico. ¿Puedes repetir?', 
        sender: 'juan' 
      }]);
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

  const startAvatarConversation = () => {
    if (avatarIframeRef.current) {
      avatarIframeRef.current.contentWindow.postMessage({
        type: 'streaming-embed',
        action: 'start_conversation'
      }, 'https://labs.heygen.com');
    }
  };

  const enableAvatarMicrophone = () => {
    if (avatarIframeRef.current) {
      avatarIframeRef.current.contentWindow.postMessage({
        type: 'streaming-embed',
        action: 'enable_microphone'
      }, 'https://labs.heygen.com');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
      <Head>
        <title>Juan Pablo - Spanish Tutor</title>
        <meta name="description" content="AI Spanish tutor for Mexico City preparation" />
      </Head>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'white', borderRadius: '20px', height: '700px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        
        <div style={{ background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)', color: 'white', padding: '20px', textAlign: 'center', borderRadius: '20px 20px 0 0' }}>
          <h1 style={{ fontSize: '1.8em', margin: 0 }}>🇲🇽 Juan Pablo - Tu Profesor de Español</h1>
          <div style={{ opacity: 0.9, marginTop: '5px' }}>
            {avatarLoaded ? (
              isAvatarSpeaking ? '🗣️ Juan Pablo está hablando...' : '🟢 Listo para conversar'
            ) : '🟡 Cargando avatar...'}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex' }}>
          {/* Avatar section */}
          <div style={{ flex: 2, background: '#f8f9fa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div 
              id="avatar-video-container"
              style={{ 
                width: '400px', 
                height: '300px', 
                background: '#000', 
                borderRadius: '15px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'white', 
                marginBottom: '20px',
                position: 'relative',
                overflow: 'hidden',
                border: isAvatarSpeaking ? '3px solid #4caf50' : '1px solid #ccc'
              }}
            >
              {!avatarLoaded && (
                <div style={{ textAlign: 'center', position: 'absolute', zIndex: 10 }}>
                  <div style={{ fontSize: '3em', marginBottom: '10px' }}>⏳</div>
                  <div>Cargando Juan Pablo...</div>
                  <div style={{ fontSize: '0.8em', opacity: 0.7, marginTop: '5px' }}>Pedro está preparándose</div>
                </div>
              )}
              {isAvatarSpeaking && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(76, 175, 80, 0.8)', padding: '5px 10px', borderRadius: '15px', fontSize: '0.8em' }}>
                  Hablando...
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={startAvatarConversation}
                disabled={!avatarLoaded}
                style={{ 
                  padding: '10px 20px', 
                  background: avatarLoaded ? '#28a745' : '#ccc', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '20px', 
                  cursor: avatarLoaded ? 'pointer' : 'not-allowed',
                  fontSize: '0.9em'
                }}
              >
                🎬 Iniciar Conversación
              </button>
              <button
                onClick={enableAvatarMicrophone}
                disabled={!avatarLoaded}
                style={{ 
                  padding: '10px 20px', 
                  background: avatarLoaded ? '#007bff' : '#ccc', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '20px', 
                  cursor: avatarLoaded ? 'pointer' : 'not-allowed',
                  fontSize: '0.9em'
                }}
              >
                🎤 Activar Micrófono
              </button>
              <button
                onClick={() => {
                  // Force sync - ask user what Pedro just said
                  const response = prompt("¿Qué acaba de decir Juan Pablo? (Para sincronizar el chat)");
                  if (response) {
                    setMessages(prev => [...prev, { text: response, sender: 'juan' }]);
                  }
                }}
                disabled={!avatarLoaded}
                style={{ 
                  padding: '8px 16px', 
                  background: avatarLoaded ? '#17a2b8' : '#ccc', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '15px', 
                  cursor: avatarLoaded ? 'pointer' : 'not-allowed',
                  fontSize: '0.8em'
                }}
              >
                ⚡ Sincronizar
              </button>
            </div>
            
            <div style={{ marginTop: '15px', fontSize: '0.9em', color: '#666', textAlign: 'center', maxWidth: '350px' }}>
              {avatarLoaded ? (
                <>
                  ✅ <strong>Juan Pablo está listo</strong><br/>
                  Habla directamente con él o escribe abajo. Las conversaciones aparecerán sincronizadas en el chat.
                </>
              ) : (
                '⏳ Cargando avatar de video... Un momento por favor.'
              )}
            </div>
          </div>

          {/* Chat section */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderLeft: '2px solid #e9ecef' }}>
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
                    lineHeight: '1.4',
                    animation: 'fadeIn 0.3s ease-out'
                  }}>
                    {msg.text}
                    {msg.sender === 'juan' && isAvatarSpeaking && index === messages.length - 1 && (
                      <div style={{ fontSize: '0.8em', opacity: 0.6, marginTop: '5px' }}>
                        🗣️ Juan Pablo está diciendo esto ahora
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{ textAlign: 'left', marginBottom: '15px' }}>
                  <div style={{ display: 'inline-block', padding: '12px 18px', background: 'white', border: '1px solid #e9ecef', borderRadius: '18px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                    <span style={{ opacity: 0.7 }}>
                      {avatarLoaded ? 'Juan Pablo está pensando...' : 'Procesando mensaje...'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ padding: '20px', background: 'white', borderTop: '2px solid #e9ecef' }}>
              <div style={{ marginBottom: '10px', fontSize: '0.8em', color: '#666', textAlign: 'center' }}>
                💡 Tip: {avatarLoaded ? 'Puedes hablar directamente con Juan Pablo arriba o escribir aquí' : 'Escribe tu mensaje mientras se carga el avatar'}
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                  placeholder="Escribe en español o inglés..."
                  disabled={isLoading}
                  style={{ 
                    flex: 1, 
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
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    border: 'none',
                    background: isListening ? '#4caf50' : '#ff6b6b',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: isListening ? 'scale(1.1)' : 'scale(1)'
                  }}
                  title={isListening ? 'Haz clic para parar' : 'Haz clic y habla (se enviará automáticamente)'}
                >
                  🎤
                </button>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputMessage.trim()}
                  style={{ 
                    padding: '12px 25px', 
                    background: isLoading || !inputMessage.trim() ? '#ccc' : '#667eea', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '25px', 
                    cursor: isLoading || !inputMessage.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isLoading ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
