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
  
  // Translation features
  const [messageTranslations, setMessageTranslations] = useState({});
  const [translatingMessageId, setTranslatingMessageId] = useState(null);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  
  // Video mode translator
  const [translatorInput, setTranslatorInput] = useState('');
  const [translatorOutput, setTranslatorOutput] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Learning system state
  const [selectedModule, setSelectedModule] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonStep, setLessonStep] = useState(0);
  const [userProgress, setUserProgress] = useState({
    totalXP: 0,
    currentStreak: 0,
    weeklyGoal: 300,
    weeklyProgress: 0,
    completedLessons: [],
    moduleProgress: {
      transport: 0,
      food: 0,
      neighborhoods: 0,
      professional: 0,
      emergency: 0,
      culture: 0
    }
  });
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const recognitionRef = useRef(null);
  const pedroListenerRef = useRef(null);
  const videoRef = useRef(null);

  // Check mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // REAL Learning Modules with Complete Lessons
  const learningModules = [
    {
      id: 'transport',
      title: 'Transporte CDMX',
      icon: '🚇',
      description: 'Metro, Metrobús, taxis y más',
      progress: userProgress.moduleProgress.transport,
      totalLessons: 4,
      xpReward: 25,
      lessons: [
        {
          id: 'transport_1',
          title: 'Comprando tu primera tarjeta del Metro',
          type: 'conversation',
          xp: 25,
          steps: [
            {
              type: 'introduction',
              content: '¡Bienvenido al Metro de Ciudad de México! Vas a aprender a comprar tu primera tarjeta del Metro.',
              audio: true
            },
            {
              type: 'vocabulary',
              question: '¿Cómo se dice "Metro card" en español?',
              options: ['tarjeta del Metro', 'boleto', 'ticket', 'pase'],
              correct: 0,
              explanation: 'En México decimos "tarjeta del Metro" o simplemente "tarjeta".'
            },
            {
              type: 'phrase',
              question: 'Completa la frase: "Una _____ del Metro, por favor"',
              answer: 'tarjeta',
              hint: 'Es lo que necesitas para entrar al Metro'
            },
            {
              type: 'conversation',
              scenario: 'Estás en la estación Insurgentes comprando tu tarjeta',
              dialogue: [
                { speaker: 'Empleado', text: 'Buenos días, ¿en qué le puedo ayudar?' },
                { speaker: 'Tú', text: 'Buenos días, una tarjeta del Metro, por favor' },
                { speaker: 'Empleado', text: 'Son 15 pesos. ¿Cuánto saldo le pongo?' },
                { speaker: 'Tú', text: 'Póngale 100 pesos, por favor' }
              ]
            }
          ]
        },
        {
          id: 'transport_2',
          title: '¿Cómo llego a...?',
          type: 'directions',
          xp: 30,
          steps: [
            {
              type: 'introduction',
              content: 'Aprende a pedir direcciones en el Metro de CDMX'
            },
            {
              type: 'vocabulary',
              question: '¿Cómo preguntas "How do I get to Roma Norte?"',
              options: [
                '¿Cómo llego a Roma Norte?',
                '¿Dónde está Roma Norte?',
                '¿Cuánto cuesta a Roma Norte?',
                '¿Qué hora es Roma Norte?'
              ],
              correct: 0,
              explanation: '"¿Cómo llego a...?" es la forma más común de pedir direcciones.'
            },
            {
              type: 'fill_blank',
              question: 'Complete: "Disculpe, ¿cómo _____ a Polanco?"',
              answer: 'llego',
              hint: 'Es el verbo "llegar" en primera persona'
            }
          ]
        },
        {
          id: 'transport_3',
          title: 'Vocabulario del transporte',
          type: 'vocabulary',
          xp: 20,
          steps: [
            {
              type: 'vocabulary_set',
              words: [
                { spanish: 'Metro', english: 'Subway', audio: true },
                { spanish: 'Metrobús', english: 'Bus Rapid Transit', audio: true },
                { spanish: 'pesero', english: 'Mini bus', audio: true },
                { spanish: 'taxi', english: 'Taxi', audio: true },
                { spanish: 'estación', english: 'Station', audio: true },
                { spanish: 'línea', english: 'Line', audio: true }
              ]
            }
          ]
        },
        {
          id: 'transport_4',
          title: 'Pronunciación de estaciones importantes',
          type: 'pronunciation',
          xp: 35,
          steps: [
            {
              type: 'pronunciation_practice',
              stations: [
                { name: 'Insurgentes', phonetic: 'in-sur-HEN-tes' },
                { name: 'Chapultepec', phonetic: 'cha-pul-TE-pec' },
                { name: 'Zócalo', phonetic: 'SO-ca-lo' },
                { name: 'Coyoacán', phonetic: 'co-yo-a-CAN' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'food',
      title: 'Comida Mexicana',
      icon: '🌮',
      description: 'Tacos, restaurantes y mercados',
      progress: userProgress.moduleProgress.food,
      totalLessons: 3,
      xpReward: 30,
      lessons: [
        {
          id: 'food_1',
          title: 'Pidiendo tacos como un chilango',
          type: 'conversation',
          xp: 30,
          steps: [
            {
              type: 'introduction',
              content: '¡Aprende a pedir tacos como un verdadero mexicano!'
            },
            {
              type: 'vocabulary',
              question: '¿Cómo pides tacos en México?',
              options: [
                'Me da tres tacos de pastor',
                'Quiero three tacos',
                'Necesito tacos please',
                'Deme tacos ahora'
              ],
              correct: 0,
              explanation: '"Me da..." es la forma más natural y educada de pedir comida en México.'
            },
            {
              type: 'conversation',
              scenario: 'En un puesto de tacos en Roma Norte',
              dialogue: [
                { speaker: 'Taquero', text: '¿Qué le doy, jefe?' },
                { speaker: 'Tú', text: 'Me da tres tacos de pastor y uno de suadero' },
                { speaker: 'Taquero', text: '¿Con todo?' },
                { speaker: 'Tú', text: 'Sí, con todo, por favor' }
              ]
            }
          ]
        },
        {
          id: 'food_2',
          title: 'Tipos de carne para tacos',
          type: 'vocabulary',
          xp: 25,
          steps: [
            {
              type: 'vocabulary_set',
              words: [
                { spanish: 'pastor', english: 'Marinated pork', audio: true },
                { spanish: 'carnitas', english: 'Slow-cooked pork', audio: true },
                { spanish: 'suadero', english: 'Beef brisket', audio: true },
                { spanish: 'chorizo', english: 'Mexican sausage', audio: true },
                { spanish: 'bistec', english: 'Beef steak', audio: true },
                { spanish: 'pollo', english: 'Chicken', audio: true }
              ]
            }
          ]
        },
        {
          id: 'food_3',
          title: 'En el mercado',
          type: 'conversation',
          xp: 35,
          steps: [
            {
              type: 'introduction',
              content: 'Aprende a comprar en los mercados de CDMX'
            },
            {
              type: 'vocabulary',
              question: '¿Cómo preguntas el precio en un mercado?',
              options: [
                '¿Cuánto cuesta?',
                'How much?',
                '¿Precio please?',
                '¿Money cuánto?'
              ],
              correct: 0,
              explanation: '"¿Cuánto cuesta?" es la forma correcta y educada.'
            }
          ]
        }
      ]
    },
    {
      id: 'neighborhoods',
      title: 'Barrios CDMX',
      icon: '🏘️',
      description: 'Roma, Condesa, Polanco y más',
      progress: userProgress.moduleProgress.neighborhoods,
      totalLessons: 2,
      xpReward: 35,
      lessons: [
        {
          id: 'neighborhoods_1',
          title: 'Conociendo Roma Norte',
          type: 'cultural',
          xp: 35,
          steps: [
            {
              type: 'introduction',
              content: 'Roma Norte es uno de los barrios más trendy de CDMX'
            },
            {
              type: 'vocabulary',
              question: '¿Cómo describes un barrio "trendy" en español?',
              options: ['moderno', 'viejo', 'feo', 'caro'],
              correct: 0,
              explanation: '"Moderno" o "de moda" son buenas traducciones para "trendy".'
            }
          ]
        },
        {
          id: 'neighborhoods_2',
          title: 'La Condesa y sus cafés',
          type: 'cultural',
          xp: 30,
          steps: [
            {
              type: 'introduction',
              content: 'La Condesa es famosa por sus cafeterías y parques'
            },
            {
              type: 'vocabulary',
              question: '¿Cómo pides un café en México?',
              options: [
                'Un café, por favor',
                'One coffee please',
                'Dame coffee',
                'Café give me'
              ],
              correct: 0,
              explanation: '"Un café, por favor" es la forma más educada.'
            }
          ]
        }
      ]
    }
  ];

  // Get current lesson content
  const getCurrentLessonStep = () => {
    if (!currentLesson || !currentLesson.steps) return null;
    return currentLesson.steps[lessonStep] || null;
  };

  // Handle lesson answer submission
  const handleLessonAnswer = () => {
    const step = getCurrentLessonStep();
    if (!step) return;

    let correct = false;
    
    if (step.type === 'vocabulary') {
      correct = userAnswer === step.correct.toString();
    } else if (step.type === 'phrase' || step.type === 'fill_blank') {
      correct = userAnswer.toLowerCase().trim() === step.answer.toLowerCase();
    }

    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      // Award XP for correct answer
      setUserProgress(prev => ({
        ...prev,
        totalXP: prev.totalXP + 5,
        weeklyProgress: prev.weeklyProgress + 5
      }));
    }

    // Auto-advance after 2 seconds
    setTimeout(() => {
      setShowFeedback(false);
      setUserAnswer('');
      
      if (lessonStep < currentLesson.steps.length - 1) {
        setLessonStep(prev => prev + 1);
      } else {
        // Lesson completed!
        completeLesson();
      }
    }, 2000);
  };

  // Complete lesson and award XP
  const completeLesson = () => {
    const lessonXP = currentLesson.xp;
    
    setUserProgress(prev => ({
      ...prev,
      totalXP: prev.totalXP + lessonXP,
      weeklyProgress: prev.weeklyProgress + lessonXP,
      completedLessons: [...prev.completedLessons, currentLesson.id],
      currentStreak: prev.currentStreak + 1,
      moduleProgress: {
        ...prev.moduleProgress,
        [selectedModule.id]: prev.moduleProgress[selectedModule.id] + 1
      }
    }));

    // Show completion celebration
    alert(`¡Felicidades! 🎉\nLección completada\n+${lessonXP} XP\nTotal XP: ${userProgress.totalXP + lessonXP}`);
    
    // Return to module
    setCurrentLesson(null);
    setLessonStep(0);
  };

  // Speak message with Mexican Spanish pronunciation
  const speakMessage = async (messageText, messageIndex) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setSpeakingMessageId(null);
    }

    if (speakingMessageId === messageIndex) {
      return;
    }

    setSpeakingMessageId(messageIndex);
    
    try {
      const cleanText = messageText.replace(/[🔊🇺🇸🇲🇽]/g, '').replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '');
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'es-MX';
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      
      const voices = speechSynthesis.getVoices();
      const spanishVoice = voices.find(voice => 
        voice.lang.includes('es-MX') || voice.lang.includes('es-ES') || voice.lang.includes('es')
      );
      if (spanishVoice) utterance.voice = spanishVoice;

      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);

      speechSynthesis.speak(utterance);
      setCurrentAudio({ pause: () => speechSynthesis.cancel(), currentTime: 0 });
    } catch (error) {
      console.error('Speech error:', error);
      setSpeakingMessageId(null);
    }
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

  // Translator function for video mode
  const translateText = async (text) => {
    if (!text.trim()) return;
    
    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: 'es' })
      });

      const data = await response.json();
      if (data.translatedText) {
        setTranslatorOutput(data.translatedText);
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatorOutput('Translation failed - try again');
    }
    setIsTranslating(false);
  };

  // Send message in chat mode
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

      const data = await response.json();
      const juanPabloResponse = data.response || data.reply;

      if (juanPabloResponse) {
        const botMessage = { text: juanPabloResponse, sender: 'bot' };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const fallbackMessage = { 
        text: "¡Órale! Se me fue la señal. ¿Puedes repetir tu pregunta? 📱", 
        sender: 'bot' 
      };
      setMessages(prev => [...prev, fallbackMessage]);
    }

    setInputMessage('');
    setIsLoading(false);
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
  };

  const startVideoMode = () => {
    setCurrentMode('video');
    setMessages([]);
  };

  const startChatMode = () => {
    setCurrentMode('chat');
    setMessages([
      { 
        text: "¡Hola! 👋🇲🇽 Soy Juan Pablo, tu profesor de español mexicano. Estoy súper emocionado de ayudarte a prepararte para tu mudanza a Ciudad de México en septiembre.\n\n🎯 Puedo ayudarte con:\n• Correcciones de gramática y pronunciación\n• Frases útiles para la vida diaria en CDMX\n• Modismos y cultura mexicana\n• Situaciones reales (transporte, comida, trabajo)\n\n¿En qué te gustaría empezar a practicar hoy? Puedes escribir en inglés o español - ¡yo te ayudo! 😊",
        sender: 'bot'
      }
    ]);
  };

  const startLearningMode = () => {
    setCurrentMode('learning');
    setMessages([]);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video && !showModeSelection) {
      const handleCanPlay = () => {
        console.log('Video can play');
        setShowModeSelection(true);
      };
      const handleError = () => {
        console.log('Video error, showing mode selection');
        setShowModeSelection(true);
      };
      const handleEnded = () => {
        console.log('Video ended, showing mode selection');
        setShowModeSelection(true);
      };
      
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);
      video.addEventListener('ended', handleEnded);
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [showModeSelection]);

  // Simple video intro (marketing sizzle reel)
  if (!showModeSelection) {
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
        </Head>
        
        <video 
          ref={videoRef}
          autoPlay 
          muted 
          playsInline
          style={{ 
            width: isMobile ? '100%' : 'auto',
            height: isMobile ? 'auto' : '100%',
            maxWidth: '100%',
            objectFit: isMobile ? 'contain' : 'cover'
          }}
        >
          <source src="/intro-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Mode selection
  if (!currentMode) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#000000',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <Head>
          <title>Juan Pablo - Elige tu modo</title>
        </Head>

        <div style={{ 
          textAlign: 'center',
          maxWidth: '1200px',
          width: '100%'
        }}>
          <h1 style={{ 
            color: 'white', 
            fontSize: isMobile ? '2.5em' : '3.5em', 
            marginBottom: '20px',
            fontWeight: '700'
          }}>
            🇲🇽 Juan Pablo
          </h1>
          <p style={{ 
            color: 'rgba(255,255,255,0.8)', 
            fontSize: isMobile ? '1.1em' : '1.3em',
            marginBottom: '50px',
            maxWidth: '600px',
            margin: '0 auto 50px auto'
          }}>
            Tu compañero de aprendizaje de español mexicano para Ciudad de México
          </p>

          {/* Mode Cards */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
            gap: '25px',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            {/* Video Chat */}
            <div 
              onClick={startVideoMode}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '2px solid white',
                borderRadius: '20px',
                padding: '40px 30px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-5px)';
                e.target.style.background = 'rgba(255,255,255,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.background = 'rgba(255,255,255,0.1)';
              }}
            >
              <div style={{ fontSize: '3em', marginBottom: '20px' }}>🎥</div>
              <h3 style={{ 
                color: 'white', 
                fontSize: '1.4em', 
                marginBottom: '15px',
                fontWeight: '600'
              }}>
                Video Chat
              </h3>
              <p style={{ 
                color: 'rgba(255,255,255,0.8)', 
                fontSize: '1em',
                lineHeight: '1.5',
                margin: 0
              }}>
                Conversa cara a cara con Pedro en español mexicano
              </p>
            </div>

            {/* Text Chat */}
            <div 
              onClick={startChatMode}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '2px solid white',
                borderRadius: '20px',
                padding: '40px 30px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-5px)';
                e.target.style.background = 'rgba(255,255,255,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.background = 'rgba(255,255,255,0.1)';
              }}
            >
              <div style={{ fontSize: '3em', marginBottom: '20px' }}>💬</div>
              <h3 style={{ 
                color: 'white', 
                fontSize: '1.4em', 
                marginBottom: '15px',
                fontWeight: '600'
              }}>
                Chat Texto
              </h3>
              <p style={{ 
                color: 'rgba(255,255,255,0.8)', 
                fontSize: '1em',
                lineHeight: '1.5',
                margin: 0
              }}>
                Chatea por texto con Juan Pablo y practica español
              </p>
            </div>

            {/* Learning Lessons */}
            <div 
              onClick={startLearningMode}
              style={{
                background: 'linear-gradient(135deg, rgba(76,175,80,0.2), rgba(33,150,243,0.2))',
                border: '2px solid white',
                borderRadius: '20px',
                padding: '40px 30px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-5px)';
                e.target.style.background = 'linear-gradient(135deg, rgba(76,175,80,0.3), rgba(33,150,243,0.3))';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.background = 'linear-gradient(135deg, rgba(76,175,80,0.2), rgba(33,150,243,0.2))';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '15px',
                background: '#4CAF50',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '15px',
                fontSize: '0.7em',
                fontWeight: '700'
              }}>
                ✨ NUEVO
              </div>
              <div style={{ fontSize: '3em', marginBottom: '20px' }}>📚</div>
              <h3 style={{ 
                color: 'white', 
                fontSize: '1.4em', 
                marginBottom: '15px',
                fontWeight: '600'
              }}>
                Lecciones CDMX
              </h3>
              <p style={{ 
                color: 'rgba(255,255,255,0.8)', 
                fontSize: '1em',
                lineHeight: '1.5',
                margin: 0
              }}>
                Sistema de aprendizaje estructurado para vivir en CDMX
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Video Mode
  if (currentMode === 'video') {
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
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <Head>
          <title>Juan Pablo - Video Chat</title>
        </Head>

        <div style={{ 
          position: 'relative',
          width: isMobile ? '100%' : 'auto',
          height: isMobile ? 'auto' : '100%',
          maxWidth: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <iframe
            src="https://app.heygen.com/embeds/c4816a18af5f49348e6dce99235b52a0"
            style={{
              width: isMobile ? '100%' : 'auto',
              height: isMobile ? 'auto' : '100%',
              maxWidth: '100%',
              objectFit: isMobile ? 'contain' : 'cover',
              border: '4px solid white',
              borderRadius: '12px'
            }}
            frameBorder="0"
            allow="camera; microphone"
          />
        </div>

        <div style={{
          position: 'absolute',
          bottom: isMobile ? '20px' : '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: isMobile ? '95%' : '600px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '15px',
          alignItems: 'center'
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            padding: '15px 20px',
            borderRadius: '25px',
            border: '2px solid white',
            backdropFilter: 'blur(10px)',
            width: '100%',
            maxWidth: '500px'
          }}>
            <div style={{ 
              color: 'white', 
              fontSize: '0.9em', 
              marginBottom: '10px',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              🇺🇸 English → 🇲🇽 Español
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                value={translatorInput}
                onChange={(e) => setTranslatorInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && translateText(translatorInput)}
                placeholder="Type in English..."
                style={{
                  flex: 1,
                  padding: '12px 15px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
              <button
                onClick={() => translateText(translatorInput)}
                disabled={isTranslating}
                style={{
                  background: isTranslating ? '#666' : '#007AFF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isTranslating ? 'not-allowed' : 'pointer'
                }}
              >
                {isTranslating ? '🔄' : 'Traducir'}
              </button>
            </div>
            {translatorOutput && (
              <div style={{
                marginTop: '10px',
                padding: '10px 15px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '15px',
                color: 'white',
                fontSize: '16px'
              }}>
                🇲🇽 {translatorOutput}
              </div>
            )}
          </div>
          
          <button
            onClick={goBack}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid white',
              borderRadius: '15px',
              padding: '15px 25px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              minWidth: isMobile ? '100%' : 'auto'
            }}
          >
            ← Volver
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
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Head>
          <title>Juan Pablo - Chat</title>
        </Head>

        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '900px',
          margin: '0 auto',
          width: '100%',
          padding: isMobile ? '10px' : '20px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            border: '2px solid white',
            borderRadius: '20px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            margin: isMobile ? '10px 0' : '20px 0'
          }}>
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '20px',
              borderBottom: '1px solid rgba(255,255,255,0.2)',
              textAlign: 'center'
            }}>
              <h2 style={{ 
                color: 'white', 
                margin: 0, 
                fontSize: isMobile ? '1.5em' : '1.8em',
                fontWeight: '700'
              }}>
                💬 Chat con Juan Pablo
              </h2>
              <p style={{ 
                color: 'rgba(255,255,255,0.8)', 
                margin: '8px 0 0 0',
                fontSize: '0.9em'
              }}>
                Tu profesor de español mexicano
              </p>
            </div>

            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              background: '#000000'
            }}>
              {messages.map((msg, index) => (
                <div key={index} style={{ 
                  padding: '15px 20px',
                  borderRadius: '12px',
                  background: msg.sender === 'user' ? '#ffffff' : 'rgba(255,255,255,0.1)',
                  color: msg.sender === 'user' ? '#000000' : '#ffffff',
                  marginBottom: '15px',
                  maxWidth: '85%',
                  marginLeft: msg.sender === 'user' ? 'auto' : '0',
                  marginRight: msg.sender === 'user' ? '0' : 'auto',
                  position: 'relative',
                  border: msg.sender === 'bot' ? '1px solid rgba(255,255,255,0.3)' : 'none'
                }}>
                  {msg.sender === 'bot' && (
                    <div style={{ 
                      fontSize: '0.8em', 
                      fontWeight: '600', 
                      marginBottom: '8px', 
                      opacity: 0.8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      Juan Pablo 🇲🇽
                      <button
                        onClick={() => speakMessage(msg.text, index)}
                        style={{
                          background: speakingMessageId === index ? '#ff4444' : 'rgba(255,255,255,0.2)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '0.8em',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        {speakingMessageId === index ? '⏸️' : '🔊'} MX
                      </button>
                      <button
                        onClick={() => translateMessage(msg.text, index)}
                        style={{
                          background: translatingMessageId === index ? '#007AFF' : 'rgba(255,255,255,0.2)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '0.8em',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        {translatingMessageId === index ? '🔄' : '🇺🇸'} EN
                      </button>
                    </div>
                  )}
                  
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                    {msg.text}
                  </div>

                  {messageTranslations[index] && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '8px',
                      fontSize: '0.9em',
                      fontStyle: 'italic',
                      borderLeft: '3px solid #007AFF'
                    }}>
                      🇺🇸 {messageTranslations[index]}
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div style={{
                  padding: '15px 20px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  marginBottom: '15px',
                  maxWidth: '85%',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}>
                  <div style={{ fontSize: '0.8em', fontWeight: '600', marginBottom: '8px', opacity: 0.8 }}>
                    Juan Pablo 🇲🇽
                  </div>
                  <div>Escribiendo... 🤔</div>
                </div>
              )}
            </div>

            <div style={{
              padding: '20px',
              borderTop: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.3)'
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Escribe tu mensaje..."
                  style={{
                    flex: 1,
                    padding: '15px 20px',
                    borderRadius: '25px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    fontSize: '16px',
                    outline: 'none',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    resize: 'none'
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  style={{
                    background: isLoading || !inputMessage.trim() ? '#666' : '#007AFF',
                    color: 'white',
                    border: 'none',
                    borderRadius: '25px',
                    padding: '15px 25px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: isLoading || !inputMessage.trim() ? 'not-allowed' : 'pointer',
                    minWidth: '100px'
                  }}
                >
                  {isLoading ? '🔄' : 'Enviar'}
                </button>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
            <button
              onClick={goBack}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid white',
                borderRadius: '15px',
                padding: '15px 30px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ← Volver al menú
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Learning Mode - FULLY FUNCTIONAL
  if (currentMode === 'learning') {
    // Individual Lesson View
    if (currentLesson) {
      const step = getCurrentLessonStep();
      const progress = ((lessonStep + 1) / currentLesson.steps.length) * 100;

      return (
        <div style={{ 
          minHeight: '100vh', 
          background: '#000000',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: isMobile ? '10px' : '20px'
        }}>
          <Head>
            <title>Juan Pablo - {currentLesson.title}</title>
          </Head>

          {/* Lesson Header */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            border: '2px solid white',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <h2 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '1.5em' }}>
              {currentLesson.title}
            </h2>
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '10px',
              height: '8px',
              overflow: 'hidden',
              marginTop: '10px'
            }}>
              <div style={{
                background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
                height: '100%',
                width: `${progress}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: '8px 0 0 0' }}>
              Paso {lessonStep + 1} de {currentLesson.steps.length}
            </p>
          </div>

          {/* Lesson Content */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            border: '2px solid white',
            borderRadius: '15px',
            padding: '30px',
            marginBottom: '20px',
            minHeight: '400px'
          }}>
            {step && (
              <>
                {step.type === 'introduction' && (
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ color: 'white', fontSize: '1.3em', marginBottom: '20px' }}>
                      ¡Bienvenido! 👋
                    </h3>
                    <p style={{ color: 'white', fontSize: '1.1em', lineHeight: '1.6' }}>
                      {step.content}
                    </p>
                    <button
                      onClick={() => setLessonStep(prev => prev + 1)}
                      style={{
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '25px',
                        padding: '15px 30px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        marginTop: '30px'
                      }}
                    >
                      Continuar →
                    </button>
                  </div>
                )}

                {step.type === 'vocabulary' && (
                  <div>
                    <h3 style={{ color: 'white', marginBottom: '20px' }}>
                      📚 Vocabulario
                    </h3>
                    <p style={{ color: 'white', fontSize: '1.1em', marginBottom: '30px' }}>
                      {step.question}
                    </p>
                    <div style={{ display: 'grid', gap: '15px' }}>
                      {step.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setUserAnswer(index.toString());
                            setTimeout(handleLessonAnswer, 100);
                          }}
                          style={{
                            background: userAnswer === index.toString() 
                              ? (showFeedback 
                                  ? (isCorrect ? '#4CAF50' : '#f44336')
                                  : 'rgba(255,255,255,0.3)'
                                )
                              : 'rgba(255,255,255,0.1)',
                            color: 'white',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderRadius: '12px',
                            padding: '15px 20px',
                            fontSize: '16px',
                            cursor: showFeedback ? 'not-allowed' : 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease'
                          }}
                          disabled={showFeedback}
                        >
                          {String.fromCharCode(65 + index)}. {option}
                        </button>
                      ))}
                    </div>
                    {showFeedback && (
                      <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        background: isCorrect ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                        borderRadius: '10px',
                        border: `2px solid ${isCorrect ? '#4CAF50' : '#f44336'}`
                      }}>
                        <p style={{ 
                          color: isCorrect ? '#4CAF50' : '#f44336', 
                          fontWeight: '600',
                          margin: '0 0 10px 0'
                        }}>
                          {isCorrect ? '¡Correcto! 🎉' : 'No es correcto 😔'}
                        </p>
                        {step.explanation && (
                          <p style={{ color: 'white', margin: 0 }}>
                            {step.explanation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {(step.type === 'phrase' || step.type === 'fill_blank') && (
                  <div>
                    <h3 style={{ color: 'white', marginBottom: '20px' }}>
                      ✏️ Completa la frase
                    </h3>
                    <p style={{ color: 'white', fontSize: '1.1em', marginBottom: '30px' }}>
                      {step.question}
                    </p>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !showFeedback && handleLessonAnswer()}
                        placeholder="Tu respuesta..."
                        style={{
                          flex: 1,
                          padding: '15px 20px',
                          borderRadius: '12px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          fontSize: '16px',
                          background: 'rgba(255,255,255,0.1)',
                          color: 'white',
                          outline: 'none'
                        }}
                        disabled={showFeedback}
                      />
                      <button
                        onClick={handleLessonAnswer}
                        disabled={!userAnswer.trim() || showFeedback}
                        style={{
                          background: (!userAnswer.trim() || showFeedback) ? '#666' : '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '15px 25px',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: (!userAnswer.trim() || showFeedback) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Verificar
                      </button>
                    </div>
                    {step.hint && !showFeedback && (
                      <p style={{ 
                        color: 'rgba(255,255,255,0.6)', 
                        fontSize: '0.9em',
                        marginTop: '10px'
                      }}>
                        💡 Pista: {step.hint}
                      </p>
                    )}
                    {showFeedback && (
                      <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        background: isCorrect ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                        borderRadius: '10px',
                        border: `2px solid ${isCorrect ? '#4CAF50' : '#f44336'}`
                      }}>
                        <p style={{ 
                          color: isCorrect ? '#4CAF50' : '#f44336', 
                          fontWeight: '600',
                          margin: 0
                        }}>
                          {isCorrect 
                            ? `¡Perfecto! 🎉 La respuesta es "${step.answer}"` 
                            : `La respuesta correcta es "${step.answer}"`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {step.type === 'conversation' && (
                  <div>
                    <h3 style={{ color: 'white', marginBottom: '20px' }}>
                      💬 Conversación
                    </h3>
                    <p style={{ color: 'white', fontSize: '1.1em', marginBottom: '30px' }}>
                      {step.scenario}
                    </p>
                    <div style={{ 
                      background: 'rgba(0,0,0,0.3)', 
                      borderRadius: '12px', 
                      padding: '20px',
                      marginBottom: '30px'
                    }}>
                      {step.dialogue.map((line, index) => (
                        <div key={index} style={{
                          marginBottom: '15px',
                          padding: '10px 15px',
                          borderRadius: '8px',
                          background: line.speaker === 'Tú' 
                            ? 'rgba(76, 175, 80, 0.2)' 
                            : 'rgba(255,255,255,0.1)'
                        }}>
                          <strong style={{ color: '#4CAF50' }}>{line.speaker}:</strong>
                          <span style={{ color: 'white', marginLeft: '10px' }}>
                            {line.text}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setLessonStep(prev => prev + 1)}
                      style={{
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '25px',
                        padding: '15px 30px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      ¡Entendido! Continuar →
                    </button>
                  </div>
                )}

                {step.type === 'vocabulary_set' && (
                  <div>
                    <h3 style={{ color: 'white', marginBottom: '20px' }}>
                      📖 Vocabulario nuevo
                    </h3>
                    <div style={{ display: 'grid', gap: '15px' }}>
                      {step.words.map((word, index) => (
                        <div key={index} style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderRadius: '12px',
                          padding: '20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ 
                              color: 'white', 
                              fontSize: '1.2em', 
                              fontWeight: '600',
                              marginBottom: '5px'
                            }}>
                              {word.spanish}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.7)' }}>
                              {word.english}
                            </div>
                          </div>
                          <button
                            onClick={() => speakMessage(word.spanish, `vocab_${index}`)}
                            style={{
                              background: 'rgba(255,255,255,0.2)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '14px',
                              cursor: 'pointer'
                            }}
                          >
                            🔊 MX
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setLessonStep(prev => prev + 1)}
                      style={{
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '25px',
                        padding: '15px 30px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        marginTop: '30px',
                        width: '100%'
                      }}
                    >
                      ¡Estudiado! Continuar →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom Navigation */}
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            justifyContent: 'center' 
          }}>
            <button
              onClick={() => {
                setCurrentLesson(null);
                setLessonStep(0);
                setUserAnswer('');
                setShowFeedback(false);
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid white',
                borderRadius: '15px',
                padding: '15px 30px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ← Volver al módulo
            </button>
          </div>
        </div>
      );
    }

    // Module Detail View
    if (selectedModule) {
      return (
        <div style={{ 
          minHeight: '100vh', 
          background: '#000000',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: isMobile ? '10px' : '20px'
        }}>
          <Head>
            <title>Juan Pablo - {selectedModule.title}</title>
          </Head>

          {/* Module Header */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            border: '2px solid white',
            borderRadius: '15px',
            padding: '30px',
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3em', marginBottom: '15px' }}>
              {selectedModule.icon}
            </div>
            <h2 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '2em' }}>
              {selectedModule.title}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1em', margin: '0 0 20px 0' }}>
              {selectedModule.description}
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '30px',
              flexWrap: 'wrap'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#4CAF50', fontSize: '1.5em', fontWeight: '700' }}>
                  {selectedModule.progress}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9em' }}>
                  Lecciones completadas
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#FF9800', fontSize: '1.5em', fontWeight: '700' }}>
                  {selectedModule.totalLessons}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9em' }}>
                  Lecciones totales
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#2196F3', fontSize: '1.5em', fontWeight: '700' }}>
                  {selectedModule.xpReward}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9em' }}>
                  XP por lección
                </div>
              </div>
            </div>
          </div>

          {/* Lesson List */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ 
              color: 'white', 
              fontSize: '1.5em', 
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              📚 Lecciones disponibles
            </h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              {selectedModule.lessons.map((lesson, index) => {
                const isCompleted = userProgress.completedLessons.includes(lesson.id);
                const isUnlocked = index === 0 || userProgress.completedLessons.includes(selectedModule.lessons[index - 1]?.id);
                
                return (
                  <div key={lesson.id} style={{
                    background: isCompleted 
                      ? 'rgba(76, 175, 80, 0.2)' 
                      : (isUnlocked ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'),
                    border: `2px solid ${isCompleted ? '#4CAF50' : (isUnlocked ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)')}`,
                    borderRadius: '15px',
                    padding: '20px',
                    cursor: isUnlocked ? 'pointer' : 'not-allowed',
                    opacity: isUnlocked ? 1 : 0.5,
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => isUnlocked && setCurrentLesson(lesson)}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}>
                      <h4 style={{ 
                        color: 'white', 
                        margin: 0, 
                        fontSize: '1.2em',
                        fontWeight: '600'
                      }}>
                        {isCompleted ? '✅' : (isUnlocked ? '📖' : '🔒')} {lesson.title}
                      </h4>
                      <div style={{
                        background: isCompleted ? '#4CAF50' : '#FF9800',
                        color: 'white',
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '0.8em',
                        fontWeight: '600'
                      }}>
                        +{lesson.xp} XP
                      </div>
                    </div>
                    <p style={{ 
                      color: 'rgba(255,255,255,0.7)', 
                      margin: '5px 0 0 0',
                      fontSize: '0.9em'
                    }}>
                      Tipo: {lesson.type === 'conversation' ? 'Conversación' : 
                             lesson.type === 'vocabulary' ? 'Vocabulario' :
                             lesson.type === 'pronunciation' ? 'Pronunciación' :
                             lesson.type === 'cultural' ? 'Cultural' : 'Práctica'}
                    </p>
                    {!isUnlocked && (
                      <p style={{ 
                        color: 'rgba(255,255,255,0.5)', 
                        margin: '10px 0 0 0',
                        fontSize: '0.8em',
                        fontStyle: 'italic'
                      }}>
                        Completa la lección anterior para desbloquear
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Back Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => setSelectedModule(null)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid white',
                borderRadius: '15px',
                padding: '15px 30px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ← Volver a módulos
            </button>
          </div>
        </div>
      );
    }

    // Main Learning Dashboard
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#000000',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: isMobile ? '10px' : '20px'
      }}>
        <Head>
          <title>Juan Pablo - Lecciones CDMX</title>
        </Head>

        {/* Progress Dashboard */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(76,175,80,0.2), rgba(33,150,243,0.2))',
          border: '2px solid white',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            color: 'white', 
            margin: '0 0 20px 0', 
            fontSize: isMobile ? '2em' : '2.5em',
            fontWeight: '700'
          }}>
            📚 Lecciones CDMX
          </h1>
          <p style={{ 
            color: 'rgba(255,255,255,0.9)', 
            fontSize: '1.1em',
            margin: '0 0 30px 0'
          }}>
            Aprende español mexicano para vivir en Ciudad de México
          </p>

          {/* Stats Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '15px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#4CAF50', fontSize: '2em', fontWeight: '700' }}>
                {userProgress.totalXP}
              </div>
              <div style={{ color: 'white', fontSize: '0.9em' }}>XP Total</div>
            </div>
            
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '15px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#FF9800', fontSize: '2em', fontWeight: '700' }}>
                {userProgress.currentStreak}
              </div>
              <div style={{ color: 'white', fontSize: '0.9em' }}>Racha 🔥</div>
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '15px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#2196F3', fontSize: '2em', fontWeight: '700' }}>
                {userProgress.completedLessons.length}
              </div>
              <div style={{ color: 'white', fontSize: '0.9em' }}>Completadas</div>
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '15px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#9C27B0', fontSize: '2em', fontWeight: '700' }}>
                {Math.round((userProgress.weeklyProgress / userProgress.weeklyGoal) * 100)}%
              </div>
              <div style={{ color: 'white', fontSize: '0.9em' }}>Meta semanal</div>
            </div>
          </div>

          {/* Weekly Progress Bar */}
          <div style={{ margin: '20px 0' }}>
            <div style={{ 
              color: 'white', 
              fontSize: '0.9em', 
              marginBottom: '8px',
              textAlign: 'left'
            }}>
              Progreso semanal: {userProgress.weeklyProgress} / {userProgress.weeklyGoal} XP
            </div>
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '10px',
              height: '12px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
                height: '100%',
                width: `${Math.min((userProgress.weeklyProgress / userProgress.weeklyGoal) * 100, 100)}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Learning Modules */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ 
            color: 'white', 
            fontSize: '1.8em', 
            marginBottom: '25px',
            textAlign: 'center',
            fontWeight: '600'
          }}>
            🎯 Módulos de aprendizaje
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {learningModules.map((module) => (
              <div 
                key={module.id}
                onClick={() => setSelectedModule(module)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '15px',
                  padding: '25px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-3px)';
                  e.target.style.background = 'rgba(255,255,255,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                }}
              >
                <div style={{ fontSize: '2.5em', marginBottom: '15px' }}>
                  {module.icon}
                </div>
                <h3 style={{ 
                  color: 'white', 
                  fontSize: '1.3em', 
                  marginBottom: '10px',
                  fontWeight: '600'
                }}>
                  {module.title}
                </h3>
                <p style={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  fontSize: '0.9em',
                  marginBottom: '20px'
                }}>
                  {module.description}
                </p>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <div style={{ 
                    color: '#4CAF50', 
                    fontSize: '1.1em',
                    fontWeight: '600'
                  }}>
                    {module.progress}/{module.totalLessons} lecciones
                  </div>
                  <div style={{
                    background: '#FF9800',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '15px',
                    fontSize: '0.8em',
                    fontWeight: '600'
                  }}>
                    +{module.xpReward} XP
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px',
                  height: '6px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: '#4CAF50',
                    height: '100%',
                    width: `${(module.progress / module.totalLessons) * 100}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={goBack}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid white',
              borderRadius: '15px',
              padding: '15px 30px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ← Volver al menú principal
          </button>
        </div>
      </div>
    );
  }

  return null;
}
