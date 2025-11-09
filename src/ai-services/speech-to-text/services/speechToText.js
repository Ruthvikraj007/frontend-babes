// Speech-to-Text Service using Web Speech API
class SpeechToTextService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onTranscript = null;
    this.onError = null;
    this.interimTranscript = '';
    this.finalTranscript = '';
  }

  initialize() {
    try {
      // Check for browser support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.error('❌ Speech Recognition not supported in this browser');
        return false;
      }

      console.log('🎤 Initializing Speech-to-Text...');
      
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        console.log('✅ Speech recognition started');
        this.isListening = true;
      };

      this.recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            final += transcript + ' ';
            this.finalTranscript += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        this.interimTranscript = interim;

        if (this.onTranscript) {
          this.onTranscript({
            interim: interim,
            final: final.trim(),
            fullTranscript: this.finalTranscript.trim(),
            timestamp: Date.now()
          });
        }
      };

      this.recognition.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error);
        
        if (event.error === 'no-speech') {
          console.log('⚠️ No speech detected');
        } else if (event.error === 'network') {
          console.error('❌ Network error');
        }

        if (this.onError) {
          this.onError(event.error);
        }
      };

      this.recognition.onend = () => {
        console.log('🔴 Speech recognition ended');
        this.isListening = false;
        
        // Auto-restart if it was supposed to be continuous
        if (this.shouldBeListening) {
          console.log('🔄 Restarting speech recognition');
          this.start();
        }
      };

      return true;
    } catch (error) {
      console.error('❌ Error initializing Speech-to-Text:', error);
      return false;
    }
  }

  start(onTranscript, onError) {
    if (!this.recognition) {
      console.error('❌ Speech recognition not initialized');
      return false;
    }

    if (this.isListening) {
      console.log('⚠️ Already listening');
      return true;
    }

    try {
      this.onTranscript = onTranscript;
      this.onError = onError;
      this.shouldBeListening = true;
      this.finalTranscript = '';
      this.interimTranscript = '';
      
      this.recognition.start();
      console.log('🎤 Started listening...');
      return true;
    } catch (error) {
      console.error('❌ Error starting speech recognition:', error);
      return false;
    }
  }

  stop() {
    if (!this.recognition) {
      return;
    }

    try {
      this.shouldBeListening = false;
      this.recognition.stop();
      this.isListening = false;
      console.log('🔴 Stopped listening');
    } catch (error) {
      console.error('❌ Error stopping speech recognition:', error);
    }
  }

  clearTranscript() {
    this.finalTranscript = '';
    this.interimTranscript = '';
  }

  setLanguage(langCode) {
    if (this.recognition) {
      this.recognition.lang = langCode;
      console.log(`🌐 Language set to: ${langCode}`);
    }
  }

  cleanup() {
    this.stop();
    this.recognition = null;
    this.onTranscript = null;
    this.onError = null;
    console.log('🧹 Speech-to-Text cleaned up');
  }
}

export default new SpeechToTextService();
