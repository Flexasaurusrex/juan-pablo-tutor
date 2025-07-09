import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function JuanPablo() {
  const [config, setConfig] = useState({
    heygenApiKey: '',
    togetherApiKey: '',
    avatarId: ''
  });
  const [isConfigured, setIsConfigured] = useState(false);
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

  const handleConfigure = () => {
    if (!config.heygenApiKey || !config.togetherApiKey || !config.avatarId) {
      alert('Por favor, completa todos los campos');
      return;
    }
    setIsConfigured(true);
  };

  const startConversation = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/heygen-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_session',
          heygenApiKey: config.heygenApiKey,
          avatarId: config.avatarId
        }),
      });

      const data = await response.json();
      
      if (data.session_id || data.success) {
        setIsConnected(true);
        console.log('HeyGen session started');
      } else {
        console.error('Failed to start session:', data);
        alert('Error al conectar con Juan Pablo. Verifica tu Avatar ID.');
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      alert('Error al conectar con Juan Pablo');
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
          action: 'stop_session',
          heygenApiKey: config.heygenApiKey
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
      // Get response from Together.ai
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          togetherApiKey: config.togetherApiKey
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
            heygenApiKey: config.heygenApiKey,
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

  if (!isConfigured) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Head>
          <title>Juan Pablo - Spanish Tutor</title>
          <meta name="description" content="AI Spanish tutor for Mexico City preparation" />
        </Head>
        
        <div style={{ background: 'white', padding: '40px', borderRadius: '20px', maxWidth: '500px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#333', fontSize: '2em' }}>🇲🇽 Configurar Juan Pablo</h1>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              HeyGen API Key:
            </label>
            <input
              type="password"
              value={config.heygenApiKey}
              onChange={(e) => setConfig({...config, heygenApiKey: e.target.value})}
              style={{ width: '100%', padding: '12px', border: '2px solid #e9ecef', borderRadius: '8px', fontSize: '16px', outline: 'none' }}
              placeholder="Ingresa tu HeyGen API key"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Together.ai API Key:
            </label>
            <input
              type="password"
              value={config.togetherApiKey}
              onChange={(e) => setConfig({...config, togetherApiKey: e.target.value})}
              style={{ width: '100%', padding: '12px', border: '2px solid #e9ecef', borderRadius: '8px', fontSize: '16px', outline: 'none' }}
              placeholder="Ingresa tu Together.ai API key"
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Avatar ID:
            </label>
            <input
              type="text"
              value={config.avatarId}
              onChange={(e) => setConfig({...config, avatarId: e.target.value})}
              style={{ width: '100%', padding: '12px', border: '2px solid #e9ecef', borderRadius: '8px', fontSize: '16px', outline: 'none' }}
              placeholder="ID del avatar de HeyGen"
            />
          </div>

          <button
            onClick={handleConfigure}
            style={{ width: '100%', padding: '15px', background: '#667eea', color: 'white', border: 'none', borderRadius: '25px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s ease' }}
            onMouseOver={(e) => e.target.style.background = '#5a6fd8'}
            onMouseOut={(e) => e.target.style.background = '#667eea'}
          >
            Inicializar Juan Pablo
          </button>

          <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px', fontSize: '14px', color: '#856404' }}>
            <strong>Pasos para obtener las APIs:</strong><br/>
            1. HeyGen: Interactive Avatar → crear avatar → copiar Avatar ID<br/>
            2. Together.ai: Dashboard → API Keys → crear nueva key<br/>
            3. Pegar todo aquí y comenzar a chatear con Juan Pablo
          </div>
        </div>
      </div>
    );
  }

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
            {isConnected ? '🟢 Conectado con avatar' : '🔴 Solo texto (avatar desconectado)'}
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
                  <div style={{ fontSize: '0.8em', opacity: 0.7, marginTop: '5px' }}>Presiona "Conectar Avatar" para video</div>
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
                'Puedes chatear sin avatar. Conecta para experiencia completa con video.'
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
