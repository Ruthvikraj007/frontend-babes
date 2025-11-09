// Hook for integrating AI services with video calls
import { useState, useEffect, useRef, useCallback } from 'react';
import signLanguageDetector from '../ai-services/sign-language-detection/services/signLanguageDetector';
import speechToText from '../ai-services/speech-to-text/services/speechToText';
import textToSpeech from '../ai-services/text-to-speech/services/textToSpeech';
import sentenceBuilder from '../services/sentenceBuilder';

export const useAIServices = (userType, localVideoRef) => {
  const [signDetectionEnabled, setSignDetectionEnabled] = useState(false);
  const [speechToTextEnabled, setSpeechToTextEnabled] = useState(false);
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(false);
  
  const [currentGesture, setCurrentGesture] = useState(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [captionHistory, setCaptionHistory] = useState([]);
  
  // Sentence building state
  const [currentWord, setCurrentWord] = useState('');
  const [currentSentence, setCurrentSentence] = useState('');
  
  const [isAIReady, setIsAIReady] = useState(false);
  const [aiError, setAiError] = useState(null);
  
  const detectionIntervalRef = useRef(null);
  const gestureHistoryRef = useRef([]);
  const lastDetectedLetterRef = useRef('');

  // Initialize AI services based on user type
  useEffect(() => {
    const initializeAI = async () => {
      try {
        console.log('🤖 Initializing AI services for user type:', userType);
        
        // Map user types (treat 'normal' as 'hearing')
        let effectiveType = userType;
        if (userType === 'normal') {
          effectiveType = 'hearing';
        } else if (!['deaf', 'hearing', 'both'].includes(userType)) {
          effectiveType = 'hearing'; // Default to hearing for unknown types
        }
        
        console.log('🔄 Effective user type:', effectiveType);
        
        if (effectiveType === 'deaf' || effectiveType === 'both') {
          // Deaf users: Enable sign language detection
          const signInitialized = await signLanguageDetector.initialize();
          if (signInitialized) {
            setSignDetectionEnabled(true);
            console.log('✅ Sign language detection enabled');
          }
        }
        
        if (effectiveType === 'hearing' || effectiveType === 'both') {
          // Hearing users: Enable speech-to-text
          const speechInitialized = speechToText.initialize();
          if (speechInitialized) {
            setSpeechToTextEnabled(true);
            console.log('✅ Speech-to-text enabled');
          }
        }
        
        // Everyone can use text-to-speech
        const ttsInitialized = textToSpeech.initialize();
        if (ttsInitialized) {
          setTextToSpeechEnabled(true);
        }
        
        setIsAIReady(true);
        console.log('✅ AI services initialized');
      } catch (error) {
        console.error('❌ Error initializing AI services:', error);
        setAiError(error.message);
      }
    };

    initializeAI();

    return () => {
      cleanup();
    };
  }, [userType]);

  // Start sign language detection
  const startSignDetection = useCallback(() => {
    if (!signDetectionEnabled || !localVideoRef?.current) {
      console.warn('⚠️ Sign detection not ready');
      return;
    }

    console.log('👋 Starting sign language detection');
    console.log('   Detection interval: 500ms');
    
    detectionIntervalRef.current = setInterval(async () => {
      const result = await signLanguageDetector.detectGesture(localVideoRef.current);
      
      // Lower threshold for better detection (hands detected = valid gesture)
      // If confidence is 0, it means MediaPipe detected hands but no score
      const MIN_CONFIDENCE = 0; // Accept all detected gestures
      
      // Check if result is valid and gesture is not null (null means confidence building for new gesture)
      if (result && result.gesture && result.gesture !== 'none' && result.gesture !== 'unknown_gesture' && result.hands && result.hands.length > 0) {
        const detectedLetter = result.gesture.toUpperCase();
        
        // Only process if it's a letter A-Z
        if (/^[A-Z]$/.test(detectedLetter)) {
          console.log(`👋 LETTER DETECTED: ${detectedLetter} (${result.confidence}% confidence)`);
          
          // Add to sentence builder
          const builderResult = sentenceBuilder.addLetter(detectedLetter, result.confidence / 100);
          
          // Update UI state
          setCurrentWord(builderResult.currentWord);
          setCurrentSentence(builderResult.sentence);
          
          // Log autocorrection
          if (builderResult.correctedWord) {
            console.log(`🔧 Auto-corrected word: ${builderResult.correctedWord}`);
          }
          
          // If word was completed, add to caption
          if (builderResult.action === 'word_completed') {
            const word = builderResult.correctedWord || builderResult.currentWord;
            console.log(`   → Caption: ${word}`);
            addCaption(`${builderResult.sentence}`, 'sign');
          }
          
          setCurrentGesture(result);
        } else {
          // Handle special gestures
          console.log(`👋 GESTURE DETECTED: ${result.gesture} (${result.confidence}% confidence)`);
          setCurrentGesture(result);
          
          // Add to caption history with interpretation
          const interpretation = interpretGesture(result.gesture);
          console.log(`   → Caption: ${interpretation}`);
          addCaption(`[Sign] ${interpretation}`, 'sign');
        }
        
        // Add to history
        gestureHistoryRef.current.push({
          gesture: result.gesture,
          timestamp: Date.now(),
          confidence: result.confidence
        });
        
        // Keep only last 50 gestures
        if (gestureHistoryRef.current.length > 50) {
          gestureHistoryRef.current.shift();
        }
      } else if (result && result.gesture === 'none') {
        // Clear current gesture when no hands detected
        setCurrentGesture(null);
      }
    }, 500); // Detect every 500ms
  }, [signDetectionEnabled, localVideoRef]);

  // Stop sign language detection
  const stopSignDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
      console.log('🛑 Stopped sign language detection');
    }
  }, []);

  // Start speech-to-text
  const startSpeechToText = useCallback(() => {
    if (!speechToTextEnabled) {
      console.warn('⚠️ Speech-to-text not ready');
      return;
    }

    console.log('🎤 Starting speech-to-text');
    console.log('   Listening continuously...');
    
    speechToText.start(
      (transcript) => {
        if (transcript.interim) {
          console.log(`🎤 INTERIM: "${transcript.interim}"`);
        }
        setInterimTranscript(transcript.interim);
        
        if (transcript.final) {
          console.log(`🎤 FINAL SPEECH: "${transcript.final}"`);
          // Use only the new final transcript, not the accumulated one
          setCurrentTranscript(transcript.final);
          addCaption(transcript.final, 'speech');
        }
      },
      (error) => {
        console.error('❌ Speech-to-text error:', error);
        setAiError(error);
      }
    );
  }, [speechToTextEnabled]);

  // Stop speech-to-text
  const stopSpeechToText = useCallback(() => {
    speechToText.stop();
    console.log('🛑 Stopped speech-to-text');
  }, []);

  // Speak text using TTS
  const speakText = useCallback((text, options = {}) => {
    if (!textToSpeechEnabled) {
      console.warn('⚠️ Text-to-speech not ready');
      return false;
    }

    return textToSpeech.speak(text, options);
  }, [textToSpeechEnabled]);

  // Stop TTS
  const stopSpeaking = useCallback(() => {
    textToSpeech.stop();
  }, []);

  // Add caption to history
  const addCaption = useCallback((text, type) => {
    const caption = {
      id: Date.now(),
      text,
      type, // 'sign', 'speech', 'system'
      timestamp: new Date().toISOString()
    };

    setCaptionHistory(prev => [...prev.slice(-20), caption]); // Keep last 20 captions
  }, []);

  // Clear caption history
  const clearCaptions = useCallback(() => {
    setCaptionHistory([]);
    setCurrentTranscript('');
    setInterimTranscript('');
    gestureHistoryRef.current = [];
  }, []);

  // Interpret gesture into readable text
  const interpretGesture = (gesture) => {
    // ASL Alphabet - single letters
    const aslLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    
    if (aslLetters.includes(gesture)) {
      return `ASL Letter: ${gesture}`;
    }
    
    // Fallback for unknown gestures
    if (gesture === 'unknown') {
      return 'Unknown gesture';
    }
    
    return gesture.replace(/_/g, ' ');
  };

  // Cleanup
  const cleanup = useCallback(() => {
    stopSignDetection();
    stopSpeechToText();
    stopSpeaking();
    
    signLanguageDetector.cleanup();
    speechToText.cleanup();
    textToSpeech.cleanup();
    
    console.log('🧹 AI services cleaned up');
  }, [stopSignDetection, stopSpeechToText, stopSpeaking]);

  // Sentence builder controls
  const addSpace = useCallback(() => {
    console.log('🔘🔘🔘 SPACE BUTTON CLICKED!!! 🔘🔘🔘');
    console.log('Current word before addSpace:', sentenceBuilder.currentWord);
    console.log('Current sentence before addSpace:', sentenceBuilder.sentence);
    
    const result = sentenceBuilder.addSpace();
    console.log('📊 Result from addSpace:', result);
    
    setCurrentWord(result.currentWord);
    setCurrentSentence(result.sentence);
    
    if (result.correctedWord) {
      console.log(`🔧 Auto-corrected: "${result.correctedWord}"`);
    }
    console.log('📝 Updated sentence:', result.sentence);
    addCaption(result.sentence, 'sign');
  }, [addCaption]);

  const backspace = useCallback(() => {
    console.log('⌫⌫⌫ BACKSPACE CLICKED!!! ⌫⌫⌫');
    const result = sentenceBuilder.backspace();
    setCurrentWord(result.currentWord);
    setCurrentSentence(result.sentence);
  }, []);

  const clearText = useCallback(() => {
    console.log('🗑️🗑️🗑️ CLEAR ALL CLICKED!!! 🗑️🗑️🗑️');
    const result = sentenceBuilder.clear();
    setCurrentWord(result.currentWord);
    setCurrentSentence(result.sentence);
  }, []);

  const clearWord = useCallback(() => {
    console.log('⌫⌫⌫ CLEAR WORD CLICKED!!! ⌫⌫⌫');
    const result = sentenceBuilder.clearWord();
    setCurrentWord(result.currentWord);
    setCurrentSentence(result.sentence);
  }, []);

  return {
    // States
    isAIReady,
    aiError,
    signDetectionEnabled,
    speechToTextEnabled,
    textToSpeechEnabled,
    
    // Sign detection
    currentGesture,
    startSignDetection,
    stopSignDetection,
    gestureHistory: gestureHistoryRef.current,
    
    // Sentence building
    currentWord,
    currentSentence,
    addSpace,
    backspace,
    clearText,
    clearWord,
    
    // Speech-to-text
    currentTranscript,
    interimTranscript,
    startSpeechToText,
    stopSpeechToText,
    
    // Text-to-speech
    speakText,
    stopSpeaking,
    
    // Captions
    captionHistory,
    addCaption,
    clearCaptions,
    
    // Cleanup
    cleanup
  };
};
