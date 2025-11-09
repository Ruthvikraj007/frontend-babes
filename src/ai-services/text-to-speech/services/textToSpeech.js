// Text-to-Speech Service using Web Speech API
class TextToSpeechService {
  constructor() {
    this.synthesis = null;
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.voices = [];
    this.selectedVoice = null;
  }

  initialize() {
    try {
      // Check for browser support
      if (!('speechSynthesis' in window)) {
        console.error('❌ Text-to-Speech not supported in this browser');
        return false;
      }

      console.log('🔊 Initializing Text-to-Speech...');
      
      this.synthesis = window.speechSynthesis;

      // Load available voices
      this.loadVoices();
      
      // Some browsers load voices asynchronously
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      }

      console.log('✅ Text-to-Speech initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing Text-to-Speech:', error);
      return false;
    }
  }

  loadVoices() {
    this.voices = this.synthesis.getVoices();
    console.log(`📢 Loaded ${this.voices.length} voices`);
    
    // Try to select a good default English voice
    this.selectedVoice = this.voices.find(voice => 
      voice.lang.startsWith('en') && voice.name.includes('Google')
    ) || this.voices.find(voice => 
      voice.lang.startsWith('en')
    ) || this.voices[0];

    if (this.selectedVoice) {
      console.log('🎙️ Selected voice:', this.selectedVoice.name);
    }
  }

  speak(text, options = {}) {
    if (!this.synthesis) {
      console.error('❌ Text-to-Speech not initialized');
      return false;
    }

    if (!text || text.trim() === '') {
      console.warn('⚠️ No text to speak');
      return false;
    }

    try {
      // Cancel any ongoing speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      // Set options
      utterance.rate = options.rate || 1.0;      // 0.1 to 10
      utterance.pitch = options.pitch || 1.0;    // 0 to 2
      utterance.volume = options.volume || 1.0;  // 0 to 1
      utterance.lang = options.lang || 'en-US';

      // Event handlers
      utterance.onstart = () => {
        this.isSpeaking = true;
        console.log('🔊 Started speaking:', text.substring(0, 50));
        if (options.onStart) options.onStart();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        console.log('✅ Finished speaking');
        if (options.onEnd) options.onEnd();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        console.error('❌ Speech error:', event.error);
        if (options.onError) options.onError(event.error);
      };

      utterance.onpause = () => {
        console.log('⏸️ Speech paused');
      };

      utterance.onresume = () => {
        console.log('▶️ Speech resumed');
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
      
      return true;
    } catch (error) {
      console.error('❌ Error speaking text:', error);
      return false;
    }
  }

  stop() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  pause() {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.pause();
    }
  }

  resume() {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.resume();
    }
  }

  setVoice(voiceName) {
    const voice = this.voices.find(v => v.name === voiceName);
    if (voice) {
      this.selectedVoice = voice;
      console.log('🎙️ Voice changed to:', voiceName);
      return true;
    }
    console.warn('⚠️ Voice not found:', voiceName);
    return false;
  }

  getVoices() {
    return this.voices.map(voice => ({
      name: voice.name,
      lang: voice.lang,
      default: voice.default,
      localService: voice.localService
    }));
  }

  cleanup() {
    this.stop();
    this.synthesis = null;
    this.voices = [];
    this.selectedVoice = null;
    console.log('🧹 Text-to-Speech cleaned up');
  }
}

export default new TextToSpeechService();
