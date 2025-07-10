import { useState, useEffect, useRef } from 'react';

export default function JuanPablo() {
  const [currentMode, setCurrentMode] = useState(null); // null, 'video', 'chat', 'learning'
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [translatorInput, setTranslatorInput] = useState('');
  const [translatorOutput, setTranslatorOutput] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // Translation features
  const [messageTranslations, setMessageTranslations] = useState({});
  const [translatingMessageId, setTranslatingMessageId] = useState(null);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);

  // Learning system state - RESET TO DEFAULTS FOR NEW USER
  const [selectedModule, setSelectedModule] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [userProgress, setUserProgress] = useState({
    totalXP: 0,
    streakDays: 0,
    weeklyGoal: 150,
    weeklyXP: 0,
    completedLessons: [], // Start empty - no completed lessons
    moduleProgress: {} // Start empty - no module progress
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});

  const recognitionRef = useRef(null);
  const pedroListenerRef = useRef(null);
  const videoRef = useRef(null);

  // Real lesson content - starting from scratch
  const learningModules = [
    {
      id: 'transport',
      title: 'Transporte CDMX',
      icon: '🚇',
      description: 'Metro, Metrobús, taxis y Uber',
      lessons: [
        {
          id: 'transport_1',
          title: 'Comprando tu primera tarjeta del Metro',
          type: 'interactive',
          xp: 25,
          steps: [
            {
              type: 'intro',
              content: '¡Bienvenido a tu primera lección! Aprenderás a comprar una tarjeta del Metro en Ciudad de México.',
              audio: 'Bienvenido a tu primera lección'
            },
            {
              type: 'vocabulary',
              question: '¿Cómo se dice "Metro card" en español?',
              options: ['tarjeta del Metro', 'boleto', 'ticket', 'pase'],
              correct: 0,
              explanation: 'En México usamos "tarjeta del Metro" para la tarjeta recargable del transporte público.'
            },
            {
              type: 'phrase',
              question: 'Completa la frase: "Una _____ del Metro, por favor"',
              answer: 'tarjeta',
              hint: 'Es lo que necesitas para usar el Metro'
            },
            {
              type: 'conversation',
              scenario: 'Estás en una estación del Metro. ¿Qué dices?',
              options: [
                'Una tarjeta del Metro, por favor',
                'Quiero un boleto',
                'Dame una card',
                'I need a Metro card'
              ],
              correct: 0,
              explanation: 'La forma correcta y educada es "Una tarjeta del Metro, por favor"'
            }
          ]
        },
        {
          id: 'transport_2',
          title: 'Pidiendo direcciones',
          type: 'conversation',
          xp: 30,
          steps: [
            {
              type: 'intro',
              content: 'Aprende a pedir direcciones en español mexicano.',
              audio: 'Aprende a pedir direcciones'
            },
            {
              type: 'vocabulary',
              question: '¿Cómo dices "How do I get to..." en español?',
              options: ['¿Cómo llego a...?', '¿Dónde está...?', '¿Cómo voy a...?', '¿Por dónde es...?'],
              correct: 0,
              explanation: '"¿Cómo llego a...?" es la forma más común en México.'
            },
            {
              type: 'phrase',
              question: 'Completa: "Disculpe, ¿cómo _____ a la estación Insurgentes?"',
              answer: 'llego',
              hint: 'Verbo para ir de un lugar a otro'
            }
          ]
        },
        {
          id: 'transport_3',
          title: 'Vocabulario de transporte',
          type: 'vocabulary',
          xp: 20,
          steps: [
            {
              type: 'intro',
              content: 'Aprende las palabras esenciales del transporte en CDMX.',
              audio: 'Vocabulario de transporte'
            },
            {
              type: 'vocabulary',
              question: '¿Qué significa "pesero"?',
              options: ['Metro', 'Autobús pequeño', 'Taxi', 'Bicicleta'],
              correct: 1,
              explanation: 'Un pesero es un autobús pequeño muy común en CDMX.'
            }
          ]
        },
        {
          id: 'transport_4',
          title: 'Pronunciación de estaciones',
          type: 'pronunciation',
          xp: 35,
          steps: [
            {
              type: 'intro',
              content: 'Practica la pronunciación de estaciones importantes del Metro.',
              audio: 'Pronunciación de estaciones'
            },
            {
              type: 'pronunciation',
              word: 'Insurgentes',
              phonetic: 'in-sur-HEN-tes',
              audio: 'Insurgentes'
            }
          ]
        }
      ]
    },
    {
      id: 'food',
      title: 'Comida Mexicana',
      icon: '🌮',
      description: 'Restaurantes, street food y mercados',
      lessons: [
        {
          id: 'food_1',
          title: 'Ordenando tacos',
          type: 'interactive',
          xp: 25,
          steps: [
            {
              type: 'intro',
              content: 'Aprende a ordenar tacos como un verdadero chilango.',
              audio: 'Ordenando tacos'
            },
            {
              type: 'vocabulary',
              question: '¿Cómo pides 3 tacos de pastor?',
              options: ['Tres tacos de pastor, por favor', 'Three tacos pastor', 'Tacos tres pastor', 'Dame pastor tacos'],
              correct: 0,
              explanation: 'La forma correcta es "Tres tacos de pastor, por favor"'
            }
          ]
        }
      ]
    },
    {
      id: 'neighborhoods',
      title: 'Barrios CDMX',
      icon: '🏙️',
      description: 'Roma Norte, Condesa, Polanco',
      lessons: [
        {
          id: 'neighborhoods_1',
          title: 'Navegando Roma Norte',
          type: 'interactive',
          xp: 30,
          steps: [
            {
              type: 'intro',
              content: 'Explora el trendy barrio de Roma Norte.',
              audio: 'Roma Norte'
            }
          ]
        }
      ]
    }
  ];

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  // Check if lesson is completed
  const isLessonCompleted = (lessonId) => {
    return userProgress.completedLessons.includes(lessonId);
  };

  // Get module progress
  const getModuleProgress = (moduleId) => {
    const module = learningModules.find(m => m.id === moduleId);
    if (!module) return 0;
    
    const completedCount = module.lessons.filter(lesson => 
      isLessonCompleted(lesson.id)
    ).length;
    
    return Math.round((completedCount / module.lessons.length) * 100);
  };

  // Complete a lesson
  const completeLesson = (lessonId, earnedXP) => {
    if (!isLessonCompleted(lessonId)) {
      setUserProgress(prev => ({
        ...prev,
        totalXP: prev.totalXP + earnedXP,
        weeklyXP: prev.weeklyXP + earnedXP,
        completedLessons: [...prev.completedLessons, lessonId]
      }));
    }
  };

  // Start a lesson
  const startLesson = (lesson) => {
    setCurrentLesson(lesson);
    setCurrentStep(0);
    setUserAnswers({});
  };

  // Handle lesson step
  const handleStepAnswer = (answer, isCorrect) => {
    const stepKey = `${currentLesson.id}_step_${currentStep}`;
    setUserAnswers(prev => ({
      ...prev,
      [stepKey]: { answer, isCorrect }
    }));

    // Move to next step or complete lesson
    if (currentStep < currentLesson.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Lesson completed
      completeLesson(currentLesson.id, currentLesson.xp);
      setCurrentLesson(null);
      setCurrentStep(0);
      alert(`¡Felicidades! Has completado la lección y ganado ${currentLesson.xp} XP`);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowModeSelection(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const goBack = () => {
    setCurrentMode(null);
    setShowModeSelection(false);
    setMessages([]);
    setTranslatorInput('');
    setTranslatorOutput('');
    setMessageTranslations({});
    setSpeakingMessageId(null);
    setTranslatingMessageId(null);
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
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
        sender: 'juan_pablo'
      }
    ]);
  };

  const startLearningMode = () => {
    setCurrentMode('learning');
    setSelectedModule(null);
    setCurrentLesson(null);
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

  // Speak Juan Pablo's message
  const speakMessage = async (messageText, messageIndex) => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setSpeakingMessageId(null);
      return;
    }

    setSpeakingMessageId(messageIndex);

    try {
      const cleanText = messageText.replace(/[🎯🇲🇽👋😊•]/g, '').trim();
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'es-MX';
      utterance.rate = 0.85;
      
      const voices = speechSynthesis.getVoices();
      const mexicanVoice = voices.find(voice => voice.lang === 'es-MX') || 
                          voices.find(voice => voice.lang.startsWith('es'));
      
      if (mexicanVoice) {
        utterance.voice = mexicanVoice;
      }

      utterance.onend = () => {
        setSpeakingMessageId(null);
        setCurrentAudio(null);
      };

      speechSynthesis.speak(utterance);
      setCurrentAudio(utterance);
    } catch (error) {
      console.error('Speech error:', error);
      setSpeakingMessageId(null);
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
          conversationHistory: messages.slice(-10)
        })
      });

      const data = await response.json();
      const juanPabloResponse = data.reply || data.response;
      
      if (juanPabloResponse) {
        setMessages(prev => [...prev, { 
          text: juanPabloResponse, 
          sender: 'juan_pablo' 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          text: "Lo siento, hubo un error de conexión. ¿Puedes repetir tu pregunta? 🤔", 
          sender: 'juan_pablo' 
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        text: "Órale, se me fue la señal. ¿Qué me decías? 📶", 
        sender: 'juan_pablo' 
      }]);
    }

    setInputMessage('');
    setIsLoading(false);
  };

  const translateText = async (text) => {
    if (!text.trim()) return;
    
    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await response.json();
      if (data.translation) {
        setTranslatorOutput(data.translation);
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatorOutput('Error en la traducción');
    }
    
    setIsTranslating(false);
  };

  // Mode Selection Screen
  if (currentMode === null) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '20px'
      }}>
        <Head>
          <title>Juan Pablo - Spanish Learning Companion</title>
        </Head>
        
        {!showModeSelection && (
          <video 
            ref={videoRef}
            autoPlay 
            muted 
            playsInline
            onLoadedData={() => setShowModeSelection(true)}
            onError={() => setShowModeSelection(true)}
            style={{ 
              width: isMobile ? '100%' : 'auto',
              height: isMobile ? 'auto' : '100%',
              maxWidth: isMobile ? '100%' : '100%',
              maxHeight: '100%',
              objectFit: isMobile ? 'contain' : 'cover',
              border: '3px solid white',
              borderRadius: '8px'
            }}
          />
        )}

        {showModeSelection && (
          <div style={{ 
            textAlign: 'center',
            color: 'white',
            maxWidth: '1200px',
            width: '100%'
          }}>
            <h1 style={{ 
              fontSize: isMobile ? '2.5rem' : '4rem',
              fontWeight: '700',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4, #45b7d1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              ¡Hola! Soy Juan Pablo 👋
            </h1>
            
            <p style={{ 
              fontSize: isMobile ? '1.1rem' : '1.4rem',
              marginBottom: '3rem',
              opacity: 0.9,
              lineHeight: '1.6'
            }}>
              Tu compañero de español mexicano para vivir en CDMX
            </p>

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
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '30px',
                  borderRadius: '20px',
                  border: '2px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-5px)';
                  e.target.style.boxShadow = '0 20px 40px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎥</div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '600', marginBottom: '10px' }}>Video Chat</h3>
                <p style={{ opacity: 0.9, lineHeight: '1.5' }}>Conversa cara a cara con Pedro, mi avatar</p>
              </div>

              <div 
                onClick={startChatMode}
                style={{ 
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  padding: '30px',
                  borderRadius: '20px',
                  border: '2px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-5px)';
                  e.target.style.boxShadow = '0 20px 40px rgba(240, 147, 251, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>💬</div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '600', marginBottom: '10px' }}>Chat Texto</h3>
                <p style={{ opacity: 0.9, lineHeight: '1.5' }}>Practica escribiendo conmigo</p>
              </div>

              <div 
                onClick={startLearningMode}
                style={{ 
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  padding: '30px',
                  borderRadius: '20px',
                  border: '2px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-5px)';
                  e.target.style.boxShadow = '0 20px 40px rgba(79, 172, 254, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <div style={{ 
                  position: 'absolute',
                  top: '10px',
                  right: '15px',
                  background: 'rgba(255,255,255,0.2)',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: '600'
                }}>
                  ✨ NUEVO
                </div>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📚</div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '600', marginBottom: '10px' }}>Lecciones CDMX</h3>
                <p style={{ opacity: 0.9, lineHeight: '1.5' }}>Sistema de aprendizaje estructurado</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Learning Mode - Interactive CDMX Learning System
  if (currentMode === 'learning') {
    // Lesson interface
    if (currentLesson) {
      const step = currentLesson.steps[currentStep];
      
      return (
        <div style={{ 
          minHeight: '100vh', 
          background: '#000000',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '20px',
          color: 'white'
        }}>
          <Head>
            <title>Juan Pablo - {currentLesson.title}</title>
          </Head>

          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '30px',
            padding: '0 20px'
          }}>
            <button 
              onClick={() => setCurrentLesson(null)}
              style={{ 
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              ← Volver a lecciones
            </button>
            
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '1.5rem', margin: '0' }}>{currentLesson.title}</h1>
              <div style={{ 
                background: 'rgba(255,255,255,0.1)',
                padding: '8px 16px',
                borderRadius: '20px',
                marginTop: '8px',
                fontSize: '0.8rem'
              }}>
                Paso {currentStep + 1} de {currentLesson.steps.length}
              </div>
            </div>
            
            <div style={{ 
              background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
              padding: '10px 15px',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              {currentLesson.xp} XP
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ 
            background: 'rgba(255,255,255,0.1)',
            height: '8px',
            borderRadius: '4px',
            margin: '0 20px 40px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              background: 'linear-gradient(90deg, #4facfe, #00f2fe)',
              height: '100%',
              width: `${((currentStep + 1) / currentLesson.steps.length) * 100}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>

          {/* Step Content */}
          <div style={{ 
            maxWidth: '800px',
            margin: '0 auto',
            background: 'rgba(255,255,255,0.05)',
            padding: '40px',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {step.type === 'intro' && (
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>¡Empezamos!</h2>
                <p style={{ fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '30px' }}>
                  {step.content}
                </p>
                <button 
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  style={{ 
                    background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                    border: 'none',
                    color: 'white',
                    padding: '15px 30px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    fontWeight: '600'
                  }}
                >
                  Continuar →
                </button>
              </div>
            )}

            {step.type === 'vocabulary' && (
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', textAlign: 'center' }}>
                  {step.question}
                </h3>
                <div style={{ display: 'grid', gap: '15px', marginTop: '30px' }}>
                  {step.options.map((option, index) => (
                    <button 
                      key={index}
                      onClick={() => handleStepAnswer(option, index === step.correct)}
                      style={{ 
                        background: 'rgba(255,255,255,0.1)',
                        border: '2px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        padding: '20px',
                        borderRadius: '15px',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        transition: 'all 0.3s ease',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(79, 172, 254, 0.3)';
                        e.target.style.borderColor = '#4facfe';
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
              </div>
            )}

            {step.type === 'phrase' && (
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '30px' }}>
                  {step.question}
                </h3>
                <input 
                  type="text"
                  placeholder="Escribe tu respuesta..."
                  style={{ 
                    background: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    padding: '15px 20px',
                    borderRadius: '10px',
                    fontSize: '1.1rem',
                    width: '100%',
                    maxWidth: '300px',
                    marginBottom: '20px',
                    textAlign: 'center'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const isCorrect = e.target.value.toLowerCase().trim() === step.answer.toLowerCase();
                      handleStepAnswer(e.target.value, isCorrect);
                    }
                  }}
                />
                <div style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '10px' }}>
                  💡 {step.hint}
                </div>
              </div>
            )}

            {step.type === 'conversation' && (
              <div>
                <div style={{ 
                  background: 'rgba(79, 172, 254, 0.2)',
                  padding: '20px',
                  borderRadius: '15px',
                  marginBottom: '30px',
                  borderLeft: '4px solid #4facfe'
                }}>
                  <strong>Situación:</strong> {step.scenario}
                </div>
                <div style={{ display: 'grid', gap: '15px' }}>
                  {step.options.map((option, index) => (
                    <button 
                      key={index}
                      onClick={() => handleStepAnswer(option, index === step.correct)}
                      style={{ 
                        background: 'rgba(255,255,255,0.1)',
                        border: '2px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        padding: '20px',
                        borderRadius: '15px',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        transition: 'all 0.3s ease',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(79, 172, 254, 0.3)';
                        e.target.style.borderColor = '#4facfe';
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
              </div>
            )}
          </div>
        </div>
      );
    }

    // Module detail view
    if (selectedModule) {
      const module = learningModules.find(m => m.id === selectedModule);
      return (
        <div style={{ 
          minHeight: '100vh', 
          background: '#000000',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '20px',
          color: 'white'
        }}>
          <Head>
            <title>Juan Pablo - {module.title}</title>
          </Head>

          <button 
            onClick={() => setSelectedModule(null)}
            style={{ 
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginBottom: '30px'
            }}
          >
            ← Volver a módulos
          </button>

          <div style={{ 
            background: `linear-gradient(135deg, ${module.id === 'transport' ? '#667eea, #764ba2' : module.id === 'food' ? '#f093fb, #f5576c' : '#4facfe, #00f2fe'})`,
            padding: '40px',
            borderRadius: '20px',
            marginBottom: '40px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '15px' }}>{module.icon}</div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '700', margin: '0 0 10px 0' }}>
              {module.title}
            </h1>
            <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
              {module.description}
            </p>
          </div>

          <div style={{ display: 'grid', gap: '15px', maxWidth: '800px', margin: '0 auto' }}>
            {module.lessons.map((lesson, index) => {
              const completed = isLessonCompleted(lesson.id);
              return (
                <div 
                  key={lesson.id} 
                  onClick={() => startLesson(lesson)}
                  style={{
                    background: completed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.1)',
                    border: completed ? '2px solid #22c55e' : '2px solid rgba(255,255,255,0.2)',
                    padding: '25px',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (!completed) {
                      e.target.style.background = 'rgba(79, 172, 254, 0.2)';
                      e.target.style.borderColor = '#4facfe';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!completed) {
                      e.target.style.background = 'rgba(255,255,255,0.1)';
                      e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ 
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: completed ? '#22c55e' : 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem'
                    }}>
                      {completed ? '✓' : index + 1}
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>{lesson.title}</h3>
                      <div style={{ 
                        fontSize: '0.8em', 
                        opacity: 0.7,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        {lesson.type === 'interactive' && '🎯 Práctica interactiva'}
                        {lesson.type === 'conversation' && '💬 Conversación'}
                        {lesson.type === 'vocabulary' && '📚 Vocabulario'}
                        {lesson.type === 'pronunciation' && '🎙️ Pronunciación'}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      background: 'rgba(255,255,255,0.2)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      marginBottom: '5px'
                    }}>
                      +{lesson.xp} XP
                    </div>
                    <div style={{ 
                      background: completed ? '#22c55e' : '#f59e0b',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: '600'
                    }}>
                      {completed ? 'Completado' : 'Empezar'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Main learning dashboard
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#000000',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '20px',
        color: 'white'
      }}>
        <Head>
          <title>Juan Pablo - Lecciones CDMX</title>
        </Head>

        <button 
          onClick={goBack}
          style={{ 
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            marginBottom: '30px'
          }}
        >
          ← Volver
        </button>

        {/* Progress Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '30px',
          borderRadius: '20px',
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', margin: '0 0 20px 0' }}>
            🎯 Tu Progreso CDMX
          </h1>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
            gap: '20px',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div style={{ 
              background: 'rgba(255,255,255,0.2)',
              padding: '20px',
              borderRadius: '15px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>{userProgress.totalXP}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>XP Total</div>
            </div>
            
            <div style={{ 
              background: 'rgba(255,255,255,0.2)',
              padding: '20px',
              borderRadius: '15px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>{userProgress.streakDays}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Días Seguidos</div>
            </div>
            
            <div style={{ 
              background: 'rgba(255,255,255,0.2)',
              padding: '20px',
              borderRadius: '15px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>{userProgress.weeklyXP}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>XP esta semana</div>
            </div>
            
            <div style={{ 
              background: 'rgba(255,255,255,0.2)',
              padding: '20px',
              borderRadius: '15px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>{userProgress.completedLessons.length}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Lecciones</div>
            </div>
          </div>

          {/* Weekly Goal Progress */}
          <div style={{ marginTop: '30px' }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <span>Meta semanal</span>
              <span>{userProgress.weeklyXP} / {userProgress.weeklyGoal} XP</span>
            </div>
            <div style={{ 
              background: 'rgba(255,255,255,0.2)',
              height: '12px',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                background: 'linear-gradient(90deg, #4facfe, #00f2fe)',
                height: '100%',
                width: `${Math.min((userProgress.weeklyXP / userProgress.weeklyGoal) * 100, 100)}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Learning Modules */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '30px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {learningModules.map((module) => {
            const progress = getModuleProgress(module.id);
            
            return (
              <div 
                key={module.id}
                onClick={() => setSelectedModule(module.id)}
                style={{
                  background: `linear-gradient(135deg, ${
                    module.id === 'transport' ? '#667eea, #764ba2' : 
                    module.id === 'food' ? '#f093fb, #f5576c' : 
                    '#4facfe, #00f2fe'
                  })`,
                  padding: '30px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '2px solid rgba(255,255,255,0.1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-8px)';
                  e.target.style.boxShadow = '0 25px 50px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>{module.icon}</div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: '700', margin: '0 0 8px 0' }}>
                  {module.title}
                </h3>
                <p style={{ 
                  fontSize: '1rem', 
                  opacity: 0.9, 
                  margin: '0 0 20px 0',
                  lineHeight: '1.4'
                }}>
                  {module.description}
                </p>
                
                {/* Progress */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Progreso</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{progress}%</span>
                  </div>
                  <div style={{ 
                    background: 'rgba(255,255,255,0.2)',
                    height: '8px',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      background: 'rgba(255,255,255,0.8)',
                      height: '100%',
                      width: `${progress}%`,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                    {module.lessons.length} lecciones
                  </span>
                  <span style={{ 
                    background: 'rgba(255,255,255,0.2)',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    Empezar →
                  </span>
                </div>
              </div>
            );
          })}
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
        
        <button 
          onClick={goBack}
          style={{ 
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(0,0,0,0.7)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            zIndex: 1000
          }}
        >
          ← Volver
        </button>

        <div style={{ 
          width: isMobile ? '100%' : 'auto',
          height: isMobile ? 'auto' : '100%',
          maxWidth: isMobile ? '100%' : '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div 
            id="pedro-avatar"
            style={{ 
              width: isMobile ? '100%' : 'auto',
              height: isMobile ? 'auto' : '100%',
              maxWidth: '100%',
              border: '3px solid white',
              borderRadius: '12px',
              objectFit: isMobile ? 'contain' : 'cover'
            }}
          />
        </div>

        {/* Translator */}
        <div style={{ 
          position: 'absolute',
          bottom: isMobile ? '20px' : '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)',
          padding: '20px',
          borderRadius: '15px',
          border: '1px solid rgba(255,255,255,0.2)',
          width: isMobile ? 'calc(100% - 40px)' : '500px',
          maxWidth: isMobile ? 'none' : '90vw'
        }}>
          <div style={{ 
            display: 'flex',
            gap: '10px',
            marginBottom: '15px',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <input
              type="text"
              value={translatorInput}
              onChange={(e) => setTranslatorInput(e.target.value)}
              placeholder="Write in English..."
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '1rem'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  translateText(translatorInput);
                }
              }}
            />
            <button
              onClick={() => translateText(translatorInput)}
              disabled={isTranslating || !translatorInput.trim()}
              style={{
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                background: isTranslating ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #4facfe, #00f2fe)',
                color: 'white',
                cursor: isTranslating ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                minWidth: '100px'
              }}
            >
              {isTranslating ? '🔄' : 'Traducir'}
            </button>
          </div>
          
          {translatorOutput && (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '15px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '1.1rem',
              lineHeight: '1.4'
            }}>
              <strong>En español:</strong> {translatorOutput}
            </div>
          )}
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
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <Head>
          <title>Juan Pablo - Chat</title>
        </Head>
        
        <button 
          onClick={goBack}
          style={{ 
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
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
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '20px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ 
              flex: 1,
              overflowY: 'auto',
              marginBottom: '20px'
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
                  marginRight: msg.sender === 'user' ? '0' : 'auto'
                }}>
                  {msg.sender === 'juan_pablo' && (
                    <div style={{ 
                      fontSize: '0.8em', 
                      fontWeight: '600', 
                      marginBottom: '8px', 
                      opacity: 0.8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <span>Juan Pablo 🇲🇽</span>
                      <button
                        onClick={() => speakMessage(msg.text, index)}
                        style={{
                          background: speakingMessageId === index ? '#ef4444' : 'rgba(255,255,255,0.2)',
                          border: 'none',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          fontWeight: '600'
                        }}
                      >
                        {speakingMessageId === index ? '⏸️ STOP' : '🔊 MX'}
                      </button>
                      <button
                        onClick={() => translateMessage(msg.text, index)}
                        style={{
                          background: translatingMessageId === index ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                          border: 'none',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          fontWeight: '600'
                        }}
                      >
                        {translatingMessageId === index ? '🔄' : '🇺🇸 EN'}
                      </button>
                    </div>
                  )}
                  
                  <div style={{ fontSize: '1rem', lineHeight: '1.5' }}>
                    {msg.text}
                  </div>

                  {messageTranslations[index] && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '8px',
                      borderLeft: '3px solid #4facfe',
                      fontSize: '0.9rem',
                      fontStyle: 'italic',
                      color: '#e0e7ff'
                    }}>
                      <strong>🇺🇸 English:</strong> {messageTranslations[index]}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div style={{ 
                  padding: '15px 20px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  marginBottom: '15px',
                  maxWidth: '85%'
                }}>
                  <div style={{ 
                    fontSize: '0.8em', 
                    fontWeight: '600', 
                    marginBottom: '8px', 
                    opacity: 0.8 
                  }}>
                    Juan Pablo 🇲🇽
                  </div>
                  <div>Escribiendo...</div>
                </div>
              )}
            </div>

            <div style={{ 
              display: 'flex',
              gap: '10px',
              padding: '15px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escribe en español o inglés..."
                style={{
                  flex: 1,
                  padding: '12px 15px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '1rem'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    sendMessage();
                  }
                }}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                style={{
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isLoading ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #f093fb, #f5576c)',
                  color: 'white',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                {isLoading ? '⏳' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
