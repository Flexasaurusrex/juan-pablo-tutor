import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function JuanPablo() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "¡Hola! Soy Juan Pablo, tu profesor de español. Estoy aquí para ayudarte a prepararte para tu mudanza a Ciudad de México. ¿Cómo te llamas?",
      sender: 'juan'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const recognitionRef = useRef(null);

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
  }, []);

  const startConversation = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/heygen-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_session'
        }),
      });

      const data = await response.json();
      
      if (data.session_id || data.success) {
        setIsConnected(true);
        console.log('HeyGen session started');
      } else {
        console.error('Failed to start session:', data);
        alert('Error al conectar con Juan Pablo. El avatar funcionará en modo texto.');
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      alert('Error al conectar avatar. Juan Pablo funcionará en modo texto.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopConversation = async () => {
    try {
      await fetch('/api/heygen-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stop_session'
        }),
      });
      
      setIsConnected(false);
    } catch (error) {
      console.error('Failed to stop conversation:', error);
    }
  };

  const handleSendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { text: message, sender: 'user' }]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get response from Together.ai (no API key needed - using env vars)
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message
        }),
      });

      const chatData = await chatResponse.json();
      
      // Add Juan Pablo's response
      setMessages(prev => [...prev, { text: chatData.reply, sender: 'juan' }]);

      // Make avatar speak (if connected)
      if (isConnected) {
        await fetch('/api/heygen-avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'speak',
            text: chatData.reply
          }),
        });
      }

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
            {isConnected ? '🟢 Avatar conectado' : '🔴 Modo texto (conecta avatar para video)'}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex' }}>
          {/* Avatar section */}
          <div style={{ flex: 2, background: '#f8f9fa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ width: '400px', height: '300px', background: '#000', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '20px', position: 'relative' }}>
              {isConnected ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3em', marginBottom: '10px' }}>🎥</div>
                  <div>Juan Pablo está aquí</div>
                  <div style={{ fontSize: '0.8em', opacity: 0.7, marginTop: '5px' }}>Avatar de video activo</div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3em', marginBottom: '10px' }}>👋</div>
                  <div>¡Hola! Soy Juan Pablo</div>
                  <div style={{ fontSize: '0.8em', opacity: 0.7, marginTop: '5px' }}>Pedro está listo para video</div>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={startConversation}
                disabled={isConnected || isLoading}
                style={{ 
                  padding: '12px 25px', 
                  background: isConnected ? '#28a745' : '#667eea', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '25px', 
                  cursor: isConnected || isLoading ? 'not-allowed' : 'pointer',
                  opacity: isConnected || isLoading ? 0.6 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                {isLoading ? 'Conectando...' : isConnected ? 'Avatar Conectado' : 'Conectar Avatar'}
              </button>
              <button
                onClick={stopConversation}
                disabled={!isConnected}
                style={{ 
                  padding: '12px 25px', 
                  background: '#dc3545', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '25px', 
                  cursor: !isConnected ? 'not-allowed' : 'pointer',
                  opacity: !isConnected ? 0.6 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                Desconectar
              </button>
            </div>
            
            <div style={{ marginTop: '15px', fontSize: '0.9em', color: '#666', textAlign: 'center', maxWidth: '350px' }}>
              {isConnected ? 
                'Avatar conectado. Juan Pablo puede hablar y gesticular.' : 
                'Puedes chatear ahora mismo. Conecta avatar para experiencia completa con video.'
              }
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
                    lineHeight: '1.4'
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{ textAlign: 'left', marginBottom: '15px' }}>
                  <div style={{ display: 'inline-block', padding: '12px 18px', background: 'white', border: '1px solid #e9ecef', borderRadius: '18px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                    <span style={{ opacity: 0.7 }}>Juan Pablo está pensando...</span>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ padding: '20px', background: 'white', borderTop: '2px solid #e9ecef' }}>
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
                  title={isListening ? 'Haz clic para parar' : 'Haz clic y habla'}
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
    </div>
  );
}
