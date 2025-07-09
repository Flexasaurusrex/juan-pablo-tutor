// Pedro speech listener (captures his voice as text)
      pedroListenerRef.current = new webkitSpeechRecognition();
      pedroListenerRef.current.continuous = true;
      pedroListenerRef.current.interimResults = true;
      
      // Try multiple language settings for better recognition
      pedroListenerRef.current.lang = 'es-MX'; // Mexican Spanish first
      
      let silenceTimer;
      let currentTranscript = '';
      let isProcessing = false;
      
      pedroListenerRef.current.onstart = () => {
        console.log('🎙️ Pedro listener started successfully');
      };
      
      pedroListenerRef.current.onresult = (event) => {
        console.log('🎙️ Pedro speech detected:', event.results.length, 'results');
        
        // Get the latest result
        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript;
        const confidence = lastResult[0].confidence;
        
        console.log('📝 Pedro said:', transcript, 'Confidence:', confidence, 'Final:', lastResult.isFinal);
        
        // Update current transcript
        currentTranscript = transcript;
        
        // If it's a final result or high confidence, add it immediately
        if (lastResult.isFinal || confidence > 0.7) {
          if (!isProcessing && currentTranscript.trim().length > 3) {
            isProcessing = true;
            console.log('✅ Adding Pedro response to chat:', currentTranscript);
            
            setMessages(prev => [...prev, { 
              text: currentTranscript.trim(), 
              sender: 'juan',
              timestamp: new Date().toLocaleTimeString()
            }]);
            
            currentTranscript = '';
            
            // Reset processing flag after a delay
            setTimeout(() => {
              isProcessing = false;
            }, 2000);
          }
        }
        
        // Clear existing timer
        if (silenceTimer) clearTimeout(silenceTimer);
        
        // Backup timer for interim results
        if (!lastResult.isFinal) {
          silenceTimer = setTimeout(() => {
            if (!isProcessing && currentTranscript.trim().length > 3) {
              console.log('⏰ Adding Pedro response after silence:', currentTranscript);
              setMessages(prev => [...prev, { 
                text: currentTranscript.trim(), 
                sender: 'juan',
                timestamp: new Date().toLocaleTimeString()
              }]);
              currentTranscript = '';
            }
          }, 3000);
        }
      };
      
      pedroListenerRef.current.onerror = (event) => {
        console.error('❌ Pedro listener error:', event.error);
        setIsListeningToPedro(false);
        
        // Try different language if not-allowed error
        if (event.error === 'not-allowed') {
          console.log('🔄 Microphone permission denied, asking user...');
          alert('Para ver las respuestas de Pedro como texto, necesitamos permiso para usar el micrófono. Por favor, permite el acceso.');
          return;
        }
        
        // Auto-restart on other errors
        setTimeout(() => {
          if (pedroListenerRef.current && currentMode === 'video') {
            try {
              // Try alternative language on restart
              pedroListenerRef.current.lang = pedroListenerRef.current.lang === 'es-MX' ? 'es-ES' : 'en-US';
              console.log('🔄 Trying language:', pedroListenerRef.current.lang);
              pedroListenerRef.current.start();
              setIsListeningToPedro(true);
              console.log('🔄 Restarted Pedro listener after error');
            } catch (e) {
              console.error('Failed to restart Pedro listener:', e);
            }
          }
        }, 1500);
      };
      
      pedroListenerRef.current.onend = () => {
        console.log('🔄 Pedro listener ended');
        if (isListeningToPedro && currentMode === 'video') {
          setTimeout(() => {
            try {
              pedroListenerRef.current.start();
              console.log('🔄 Restarted Pedro listener');
            } catch (e) {
              console.error('Failed to restart Pedro listener:', e);
              setIsListeningToPedro(false);
            }
          }, 500);
        } else {
          setIsListeningToPedro(false);
        }
      };
