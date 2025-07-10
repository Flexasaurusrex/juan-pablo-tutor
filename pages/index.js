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
  const [gameMode, setGameMode] = useState(null); // 'multiple', 'picture'
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [streak, setStreak] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState([]);
  
  const recognitionRef = useRef(null);
  const pedroListenerRef = useRef(null);
  const videoRef = useRef(null);

  // Game state additions
  const [showQuestionTranslation, setShowQuestionTranslation] = useState(false);
  const [questionTimer, setQuestionTimer] = useState(30);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [combo, setCombo] = useState(0);

  // CDMX Learning Questions with English translations
  const multipleChoiceQuestions = [
    {
      question: "¿Cómo se dice 'subway' en México?",
      questionEN: "How do you say 'subway' in Mexico?",
      options: ["Metro", "Subte", "Tren", "Túnel"],
      optionsEN: ["Metro", "Subway (Argentina)", "Train", "Tunnel"],
      correct: 0,
      explanation: "En México City usamos 'Metro' - ¡igual que en París!",
      explanationEN: "In Mexico City we use 'Metro' - just like in Paris!"
    },
    {
      question: "¿Cuál es la forma correcta de pedir tacos?",
      questionEN: "What's the correct way to order tacos?",
      options: ["Quiero tacos", "Dame tacos", "Quisiera tacos", "Necesito tacos"],
      optionsEN: ["I want tacos", "Give me tacos", "I would like tacos", "I need tacos"],
      correct: 2,
      explanation: "'Quisiera' es más educado en México - ¡perfecto para tu primera vez!",
      explanationEN: "'Quisiera' is more polite in Mexico - perfect for your first time!"
    },
    {
      question: "¿Cómo saludas en CDMX por la mañana?",
      questionEN: "How do you greet people in CDMX in the morning?",
      options: ["¡Hola!", "¡Buenos días!", "¡Buenas!", "¡Órale!"],
      optionsEN: ["Hello!", "Good morning!", "Good (informal)!", "Wow! (expression)"],
      correct: 1,
      explanation: "'¡Buenos días!' es perfecto hasta las 12pm en México",
      explanationEN: "'¡Buenos días!' is perfect until 12pm in Mexico"
    },
    {
      question: "¿Qué significa 'chilango'?",
      questionEN: "What does 'chilango' mean?",
      options: ["Comida picante", "Persona de CDMX", "Metro rápido", "Dinero mexicano"],
      optionsEN: ["Spicy food", "Person from CDMX", "Fast metro", "Mexican money"],
      correct: 1,
      explanation: "¡Exacto! Los chilangos son las personas de Ciudad de México",
      explanationEN: "Exactly! Chilangos are people from Mexico City"
    },
    {
      question: "¿Cómo pides direcciones en español?",
      questionEN: "How do you ask for directions in Spanish?",
      options: ["¿Dónde queda...?", "¿Cuánto cuesta...?", "¿Qué hora es?", "¿Cómo te llamas?"],
      optionsEN: ["Where is...?", "How much does... cost?", "What time is it?", "What's your name?"],
      correct: 0,
      explanation: "'¿Dónde queda...?' es perfecto para preguntar ubicaciones",
      explanationEN: "'¿Dónde queda...?' is perfect for asking about locations"
    },
    {
      question: "¿Qué dices cuando entras a una tienda en México?",
      questionEN: "What do you say when entering a store in Mexico?",
      options: ["¡Hola!", "¡Buenos días!", "Disculpe", "Gracias"],
      optionsEN: ["Hello!", "Good morning/afternoon!", "Excuse me", "Thank you"],
      correct: 1,
      explanation: "¡Buenos días/tardes! es la forma educada de saludar al entrar",
      explanationEN: "¡Buenos días/tardes! is the polite way to greet when entering"
    },
    {
      question: "¿Cómo preguntas el precio de algo?",
      questionEN: "How do you ask the price of something?",
      options: ["¿Cuánto vale?", "¿Qué hora es?", "¿Dónde está?", "¿Cómo se llama?"],
      optionsEN: ["How much is it worth?", "What time is it?", "Where is it?", "What's it called?"],
      correct: 0,
      explanation: "'¿Cuánto vale?' o '¿Cuánto cuesta?' son perfectos",
      explanationEN: "'¿Cuánto vale?' or '¿Cuánto cuesta?' are perfect"
    }
  ];

  const pictureQuestions = [
    {
      picture: "🌮",
      question: "¿Cómo se llama esta comida mexicana?",
      questionEN: "What is this Mexican food called?",
      options: ["Taco", "Pizza", "Hamburguesa", "Sándwich"],
      optionsEN: ["Taco", "Pizza", "Hamburger", "Sandwich"],
      correct: 0,
      explanation: "¡Correcto! Es un taco - la comida más famosa de México",
      explanationEN: "Correct! It's a taco - Mexico's most famous food"
    },
    {
      picture: "🚇",
      question: "¿Cómo se llama este transporte en CDMX?",
      questionEN: "What is this transportation called in CDMX?",
      options: ["Metro", "Avión", "Barco", "Bicicleta"],
      optionsEN: ["Metro", "Airplane", "Boat", "Bicycle"],
      correct: 0,
      explanation: "¡Perfecto! El Metro es el transporte más rápido en Ciudad de México",
      explanationEN: "Perfect! The Metro is the fastest transportation in Mexico City"
    },
    {
      picture: "☕",
      question: "¿Qué bebida es esta?",
      questionEN: "What drink is this?",
      options: ["Café", "Agua", "Jugo", "Cerveza"],
      optionsEN: ["Coffee", "Water", "Juice", "Beer"],
      correct: 0,
      explanation: "¡Bien! El café es muy popular en México",
      explanationEN: "Good! Coffee is very popular in Mexico"
    },
    {
      picture: "🏠",
      question: "¿Cómo se dice 'house' en español?",
      questionEN: "How do you say 'house' in Spanish?",
      options: ["Casa", "Carro", "Cama", "Calle"],
      optionsEN: ["House", "Car", "Bed", "Street"],
      correct: 0,
      explanation: "¡Excelente! Casa significa 'house' en español",
      explanationEN: "Excellent! Casa means 'house' in Spanish"
    },
    {
      picture: "💧",
      question: "¿Qué es esto que necesitas para vivir?",
      questionEN: "What is this that you need to live?",
      options: ["Agua", "Fuego", "Tierra", "Aire"],
      optionsEN: ["Water", "Fire", "Earth", "Air"],
      correct: 0,
      explanation: "¡Correcto! Agua es 'water' - muy importante para la vida",
      explanationEN: "Correct! Agua is 'water' - very important for life"
    },
    {
      picture: "🌯",
      question: "¿Cómo se llama esta comida?",
      questionEN: "What is this food called?",
      options: ["Burrito", "Taco", "Quesadilla", "Enchilada"],
      optionsEN: ["Burrito", "Taco", "Quesadilla", "Enchilada"],
      correct: 0,
      explanation: "¡Bien! Un burrito es tortilla enrollada con ingredientes adentro",
      explanationEN: "Good! A burrito is a rolled tortilla with ingredients inside"
    },
    {
      picture: "🚌",
      question: "¿Cómo se dice 'bus' en español?",
      questionEN: "How do you say 'bus' in Spanish?",
      options: ["Autobús", "Carro", "Metro", "Taxi"],
      optionsEN: ["Bus", "Car", "Metro", "Taxi"],
      correct: 0,
      explanation: "¡Perfecto! Autobús es la palabra para 'bus' en español",
      explanationEN: "Perfect! Autobús is the word for 'bus' in Spanish"
    },
    {
      picture: "🥑",
      question: "¿Qué fruta mexicana es esta?",
      questionEN: "What Mexican fruit is this?",
      options: ["Aguacate", "Manzana", "Naranja", "Plátano"],
      optionsEN: ["Avocado", "Apple", "Orange", "Banana"],
      correct: 0,
      explanation: "¡Excelente! El aguacate es súper popular en México",
      explanationEN: "Excellent! Avocado is super popular in Mexico"
    }
  ];

  // Game functions with improvements
  const startGame = (mode) => {
    setGameMode(mode);
    setCurrentQuestion(0);
    setScore(0);
    setStreak(0);
    setCombo(0);
    setCompletedQuestions([]);
    setShowResult(false);
    setUserAnswer('');
    setShowQuestionTranslation(false);
    setQuestionTimer(30);
    setTimerRunning(true);
    
    // Start timer
    const timer = setInterval(() => {
      setQuestionTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimerRunning(false);
          // Auto-submit as wrong when timer expires
          if (!showResult) {
            setIsCorrect(false);
            setShowResult(true);
            setStreak(0);
            setCombo(0);
            playSound('wrong');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const playSound = (type) => {
    // Simple sound effects using Web Audio API
    if (typeof window !== 'undefined' && window.AudioContext) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (type === 'correct') {
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
      } else if (type === 'wrong') {
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.2);
      } else if (type === 'complete') {
        // Victory fanfare
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(1047, audioContext.currentTime + 0.3);
      }
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  };

  const handleMultipleChoice = (selectedIndex) => {
    if (showResult) return; // Prevent multiple clicks
    
    setTimerRunning(false);
    const question = multipleChoiceQuestions[currentQuestion];
    const correct = selectedIndex === question.correct;
    const timeBonus = questionTimer > 20 ? 5 : questionTimer > 10 ? 3 : 1;
    
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      const comboBonus = combo >= 3 ? 10 : combo >= 2 ? 5 : 0;
      const basePoints = 10;
      const streakBonus = streak * 2;
      const totalPoints = basePoints + streakBonus + timeBonus + comboBonus;
      
      setScore(score + totalPoints);
      setStreak(streak + 1);
      setCombo(combo + 1);
      
      // Trigger confetti for great answers
      if (combo >= 2 || streak >= 3) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      
      playSound('correct');
    } else {
      setStreak(0);
      setCombo(0);
      playSound('wrong');
    }
    
    setCompletedQuestions([...completedQuestions, currentQuestion]);
  };

  const handlePictureMatch = (selectedIndex) => {
    if (showResult) return; // Prevent multiple clicks
    
    setTimerRunning(false);
    const question = pictureQuestions[currentQuestion];
    const correct = selectedIndex === question.correct;
    const timeBonus = questionTimer > 20 ? 8 : questionTimer > 10 ? 5 : 2;
    
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      const comboBonus = combo >= 3 ? 15 : combo >= 2 ? 8 : 0;
      const basePoints = 12; // Slightly more than multiple choice since it's visual learning
      const streakBonus = streak * 3;
      const totalPoints = basePoints + streakBonus + timeBonus + comboBonus;
      
      setScore(score + totalPoints);
      setStreak(streak + 1);
      setCombo(combo + 1);
      
      if (combo >= 2 || streak >= 3) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      
      playSound('correct');
    } else {
      setStreak(0);
      setCombo(0);
      playSound('wrong');
    }
    
    setCompletedQuestions([...completedQuestions, currentQuestion]);
  };

  const nextQuestion = () => {
    setShowResult(false);
    setUserAnswer('');
    setShowQuestionTranslation(false);
    setQuestionTimer(30);
    setTimerRunning(true);
    
    if (gameMode === 'multiple' && currentQuestion < multipleChoiceQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (gameMode === 'picture' && currentQuestion < pictureQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Game complete
      setGameMode('complete');
      setTimerRunning(false);
      playSound('complete');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  };

  const resetGame = () => {
    setGameMode(null);
    setCurrentQuestion(0);
    setScore(0);
    setStreak(0);
    setCombo(0);
    setCompletedQuestions([]);
    setShowResult(false);
    setUserAnswer('');
    setShowQuestionTranslation(false);
    setQuestionTimer(30);
    setTimerRunning(false);
    setShowConfetti(false);
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
    // Reset all game state
    setGameMode(null);
    setCurrentQuestion(0);
    setScore(0);
    setStreak(0);
    setCombo(0);
    setCompletedQuestions([]);
    setShowResult(false);
    setUserAnswer('');
    setShowQuestionTranslation(false);
    setQuestionTimer(30);
    setTimerRunning(false);
    setShowConfetti(false);
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

  // Game Mode - ENHANCED WITH NEW FEATURES
  if (currentMode === 'game') {
    return (
      <div style={{ backgroundColor: 'black', minHeight: '100vh', color: 'white', padding: '20px', position: 'relative' }}>
        <Head>
          <title>Juegos CDMX - Juan Pablo</title>
        </Head>
        
        {/* Confetti Animation */}
        {showConfetti && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1000
          }}>
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '-10px',
                  left: Math.random() * 100 + '%',
                  width: '10px',
                  height: '10px',
                  backgroundColor: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][Math.floor(Math.random() * 5)],
                  animation: `confetti-fall 3s linear infinite`,
                  animationDelay: Math.random() * 3 + 's'
                }}
              />
            ))}
          </div>
        )}
        
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

          {/* Enhanced Score Display */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '15px', 
            marginBottom: '30px',
            flexWrap: 'wrap'
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)', 
              padding: '10px 20px', 
              borderRadius: '25px',
              color: 'black',
              fontWeight: 'bold',
              transform: showConfetti ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.3s ease'
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
            {combo > 0 && (
              <div style={{ 
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', 
                padding: '10px 20px', 
                borderRadius: '25px',
                color: 'white',
                fontWeight: 'bold',
                animation: combo >= 3 ? 'pulse 1s infinite' : 'none'
              }}>
                ⚡ Combo: {combo}x
              </div>
            )}
            {timerRunning && (
              <div style={{ 
                background: questionTimer <= 10 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', 
                padding: '10px 20px', 
                borderRadius: '25px',
                color: 'white',
                fontWeight: 'bold',
                animation: questionTimer <= 10 ? 'shake 0.5s infinite' : 'none'
              }}>
                ⏰ {questionTimer}s
              </div>
            )}
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
                    +10 puntos base • Bonus por velocidad
                  </div>
                </div>

                <div
                  onClick={() => startGame('picture')}
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
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>🖼️ Fotos y Palabras</h3>
                  <p style={{ color: 'rgba(255,255,255,0.9)' }}>Aprende vocabulario con imágenes</p>
                  <div style={{ marginTop: '15px', fontSize: '0.9rem', opacity: 0.8 }}>
                    +12 puntos base • ¡Perfecto para principiantes!
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
              border: '1px solid rgba(255,255,255,0.1)',
              animation: showResult && !isCorrect ? 'shake 0.5s ease-in-out' : 'none'
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

              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>
                  {multipleChoiceQuestions[currentQuestion].question}
                </h3>
                
                <button
                  onClick={() => setShowQuestionTranslation(!showQuestionTranslation)}
                  style={{
                    background: showQuestionTranslation ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    padding: '6px 12px',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    marginBottom: '15px'
                  }}
                >
                  {showQuestionTranslation ? '🇪🇸 Español' : '🇺🇸 English'}
                </button>

                {showQuestionTranslation && (
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '10px',
                    padding: '12px',
                    color: '#93c5fd',
                    fontStyle: 'italic',
                    marginBottom: '20px'
                  }}>
                    🇺🇸 {multipleChoiceQuestions[currentQuestion].questionEN}
                  </div>
                )}
              </div>

              {!showResult ? (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {multipleChoiceQuestions[currentQuestion].options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleMultipleChoice(index)}
                      disabled={!timerRunning && questionTimer === 0}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '2px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        padding: '15px 20px',
                        borderRadius: '10px',
                        cursor: timerRunning || questionTimer > 0 ? 'pointer' : 'not-allowed',
                        fontSize: '1.1rem',
                        transition: 'all 0.3s ease',
                        opacity: (!timerRunning && questionTimer === 0) ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (timerRunning || questionTimer > 0) {
                          e.target.style.background = 'rgba(255,255,255,0.2)';
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255,255,255,0.1)';
                        e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      <div>{option}</div>
                      {showQuestionTranslation && (
                        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginTop: '5px' }}>
                          {multipleChoiceQuestions[currentQuestion].optionsEN[index]}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '4rem', 
                    marginBottom: '20px',
                    animation: isCorrect ? 'bounce 0.6s ease-in-out' : 'shake 0.6s ease-in-out'
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
                  <p style={{ color: '#ccc', marginBottom: '10px', fontSize: '1.1rem' }}>
                    {multipleChoiceQuestions[currentQuestion].explanation}
                  </p>
                  <p style={{ color: '#93c5fd', marginBottom: '20px', fontSize: '1rem', fontStyle: 'italic' }}>
                    🇺🇸 {multipleChoiceQuestions[currentQuestion].explanationEN}
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
                      +{10 + (streak * 2) + (questionTimer > 20 ? 5 : questionTimer > 10 ? 3 : 1) + (combo >= 3 ? 10 : combo >= 2 ? 5 : 0)} puntos
                      {combo >= 2 && <span> 🔥 ¡COMBO!</span>}
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

          {gameMode === 'picture' && currentQuestion < pictureQuestions.length && (
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '30px', 
              borderRadius: '15px',
              border: '1px solid rgba(255,255,255,0.1)',
              animation: showResult && !isCorrect ? 'shake 0.5s ease-in-out' : 'none'
            }}>
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <div style={{ color: '#666', marginBottom: '10px' }}>
                  Pregunta {currentQuestion + 1} de {pictureQuestions.length}
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
                    width: `${((currentQuestion + 1) / pictureQuestions.length) * 100}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Big Picture Display */}
              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <div style={{ 
                  fontSize: '8rem', 
                  marginBottom: '20px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '20px',
                  padding: '40px',
                  display: 'inline-block',
                  border: '2px solid rgba(16, 185, 129, 0.3)'
                }}>
                  {pictureQuestions[currentQuestion].picture}
                </div>
              </div>

              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>
                  {pictureQuestions[currentQuestion].question}
                </h3>

                <button
                  onClick={() => setShowQuestionTranslation(!showQuestionTranslation)}
                  style={{
                    background: showQuestionTranslation ? '#10b981' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    padding: '6px 12px',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    marginBottom: '15px'
                  }}
                >
                  {showQuestionTranslation ? '🇪🇸 Español' : '🇺🇸 English'}
                </button>

                {showQuestionTranslation && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '10px',
                    padding: '12px',
                    color: '#6ee7b7',
                    fontStyle: 'italic',
                    marginBottom: '20px'
                  }}>
                    🇺🇸 {pictureQuestions[currentQuestion].questionEN}
                  </div>
                )}
              </div>

              {!showResult ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  {pictureQuestions[currentQuestion].options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handlePictureMatch(index)}
                      disabled={!timerRunning && questionTimer === 0}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '2px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        padding: '20px 15px',
                        borderRadius: '15px',
                        cursor: timerRunning || questionTimer > 0 ? 'pointer' : 'not-allowed',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease',
                        opacity: (!timerRunning && questionTimer === 0) ? 0.5 : 1,
                        textAlign: 'center'
                      }}
                      onMouseEnter={(e) => {
                        if (timerRunning || questionTimer > 0) {
                          e.target.style.background = 'rgba(16, 185, 129, 0.3)';
                          e.target.style.borderColor = '#10b981';
                          e.target.style.transform = 'translateY(-3px) scale(1.02)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255,255,255,0.1)';
                        e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                        e.target.style.transform = 'translateY(0) scale(1)';
                      }}
                    >
                      <div style={{ fontSize: '1.1rem', marginBottom: '5px' }}>{option}</div>
                      {showQuestionTranslation && (
                        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                          {pictureQuestions[currentQuestion].optionsEN[index]}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '4rem', 
                    marginBottom: '20px',
                    animation: isCorrect ? 'bounce 0.6s ease-in-out' : 'shake 0.6s ease-in-out'
                  }}>
                    {isCorrect ? '🎉' : '😅'}
                  </div>
                  <h4 style={{ 
                    fontSize: '1.5rem', 
                    color: isCorrect ? '#4ade80' : '#f87171',
                    marginBottom: '15px'
                  }}>
                    {isCorrect ? '¡Perfecto!' : '¡Casi! Sigue practicando'}
                  </h4>
                  <p style={{ color: '#ccc', marginBottom: '10px', fontSize: '1.1rem' }}>
                    {pictureQuestions[currentQuestion].explanation}
                  </p>
                  <p style={{ color: '#6ee7b7', marginBottom: '20px', fontSize: '1rem', fontStyle: 'italic' }}>
                    🇺🇸 {pictureQuestions[currentQuestion].explanationEN}
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
                      +{12 + (streak * 3) + (questionTimer > 20 ? 8 : questionTimer > 10 ? 5 : 2) + (combo >= 3 ? 15 : combo >= 2 ? 8 : 0)} puntos
                      {combo >= 2 && <span> 🔥 ¡COMBO!</span>}
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
                  Combo máximo: {combo}x multiplicador<br />
                  Preguntas completadas: {completedQuestions.length}
                </div>
                <div style={{ marginTop: '15px', color: '#4ade80' }}>
                  {score >= 200 ? '🌟 ¡Eres un maestro del español mexicano!' : 
                   score >= 150 ? '🎯 ¡Excelente preparación para CDMX!' :
                   score >= 100 ? '👍 ¡Buen progreso, sigue practicando!' :
                   '💪 ¡Cada intento te acerca más a México!'}
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

        <style jsx>{`
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes confetti-fall {
            0% { transform: translateY(-100vh) rotate(0deg); }
            100% { transform: translateY(100vh) rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return null;
}
