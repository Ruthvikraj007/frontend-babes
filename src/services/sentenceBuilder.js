/**
 * Sentence Builder Service
 * Builds sentences from detected ASL letters with autocorrect
 */

class SentenceBuilder {
  constructor() {
    this.currentWord = '';
    this.sentence = '';
    this.lastLetter = '';
    this.lastLetterTimestamp = 0;
    this.letterHoldTime = 1500; // Hold letter for 1.5s to register (increased to prevent duplicates)
    this.spaceHoldTime = 1500; // Hold space gesture for 1.5s
    
    // Auto-correct dictionary for common ASL misinterpretations
    this.autoCorrectDict = {
      // Common confusions
      'teh': 'the',
      'hte': 'the',
      'adn': 'and',
      'nad': 'and',
      'thsi': 'this',
      'taht': 'that',
      'waht': 'what',
      'wiht': 'with',
      'wnat': 'want',
      'hvae': 'have',
      'cna': 'can',
      'yuo': 'you',
      'yuor': 'your',
      'jsut': 'just',
      'dont': "don't",
      'cant': "can't",
      'wont': "won't",
      'im': "i'm",
      'ill': "i'll",
      'helo': 'hello',
      'helllo': 'hello',
      'hllo': 'hello',
      'thankks': 'thanks',
      'thanx': 'thanks',
      'plz': 'please',
      'pls': 'please',
      'sry': 'sorry',
      'srry': 'sorry',
      // Common words often misspelled in ASL
      'becuase': 'because',
      'beacuse': 'because',
      'freind': 'friend',
      'frend': 'friend',
      'recieve': 'receive',
      'recive': 'receive',
      'beleive': 'believe',
      'belive': 'believe',
      'occured': 'occurred',
      'seperate': 'separate',
      'definately': 'definitely',
      'tommorrow': 'tomorrow',
      'tonite': 'tonight',
      'untill': 'until',
      'thier': 'their',
      'occassion': 'occasion',
      'embarass': 'embarrass',
      'realy': 'really',
      'goverment': 'government',
      'enviroment': 'environment'
    };

    // Common words dictionary for validation
    this.commonWords = new Set([
      // Pronouns & basic words
      'i', 'me', 'my', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its',
      'we', 'us', 'our', 'they', 'them', 'their',
      
      // Common verbs
      'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'done',
      'will', 'would', 'should', 'could', 'can', 'may', 'might',
      'go', 'goes', 'went', 'come', 'comes', 'came',
      'get', 'gets', 'got', 'give', 'gives', 'gave',
      'make', 'makes', 'made', 'take', 'takes', 'took',
      'see', 'sees', 'saw', 'know', 'knows', 'knew',
      'think', 'thinks', 'thought', 'want', 'wants', 'wanted',
      'need', 'needs', 'needed', 'like', 'likes', 'liked',
      'love', 'loves', 'loved', 'help', 'helps', 'helped',
      'use', 'uses', 'used', 'work', 'works', 'worked',
      'try', 'tries', 'tried', 'ask', 'asks', 'asked',
      'feel', 'feels', 'felt', 'become', 'becomes', 'became',
      'leave', 'leaves', 'left', 'put', 'puts', 'call', 'calls', 'called',
      
      // Articles & conjunctions
      'the', 'a', 'an', 'and', 'or', 'but', 'if', 'as', 'of', 'at', 'by', 'for',
      'with', 'from', 'to', 'in', 'on', 'off', 'out', 'up', 'down',
      'about', 'over', 'under', 'again', 'then', 'than', 'so', 'such',
      
      // Question words
      'what', 'when', 'where', 'who', 'whom', 'whose', 'which', 'why', 'how',
      
      // Numbers
      'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
      'first', 'second', 'third', 'last', 'next',
      
      // Time words
      'today', 'tomorrow', 'yesterday', 'now', 'later', 'soon', 'never',
      'morning', 'afternoon', 'evening', 'night', 'day', 'week', 'month', 'year',
      'time', 'hour', 'minute', 'second',
      
      // Common adjectives
      'good', 'great', 'bad', 'new', 'old', 'big', 'small', 'long', 'short',
      'high', 'low', 'hot', 'cold', 'warm', 'cool', 'fast', 'slow',
      'easy', 'hard', 'happy', 'sad', 'nice', 'pretty', 'beautiful',
      'right', 'wrong', 'true', 'false', 'sure', 'okay', 'ok', 'fine',
      'ready', 'busy', 'free', 'full', 'empty', 'open', 'close', 'closed',
      
      // Common nouns
      'man', 'woman', 'boy', 'girl', 'person', 'people', 'child', 'children',
      'friend', 'family', 'dad', 'mom', 'parent', 'brother', 'sister',
      'home', 'house', 'room', 'door', 'window', 'car', 'phone', 'computer',
      'food', 'water', 'work', 'school', 'place', 'thing', 'way', 'life',
      'world', 'hand', 'eye', 'face', 'head', 'body', 'heart',
      
      // Polite words
      'please', 'thank', 'thanks', 'sorry', 'excuse', 'welcome', 'yes', 'no',
      'hello', 'hi', 'hey', 'bye', 'goodbye', 'goodnight',
      
      // Action words for ASL
      'talk', 'speak', 'say', 'tell', 'sign', 'show', 'look', 'watch',
      'hear', 'listen', 'understand', 'mean', 'wait', 'stop', 'start',
      'meet', 'call', 'video', 'chat', 'message', 'text'
    ]);
  }

  /**
   * Process detected letter and build sentence
   * @param {string} letter - Detected letter (A-Z)
   * @param {number} confidence - Detection confidence (0-1)
   * @returns {Object} - { currentWord, sentence, action, correctedWord }
   */
  addLetter(letter, confidence = 1.0) {
    const now = Date.now();
    const timeSinceLastLetter = now - this.lastLetterTimestamp;
    
    // Check if this letter is already the last one in the current word
    const lastLetterInWord = this.currentWord.slice(-1).toUpperCase();
    const isRepeatingLastLetter = (letter === lastLetterInWord);
    
    // PRIORITY CHECK: Prevent adding duplicate letter if it's the last letter in word and within 2 seconds
    // This catches detector smoothing issues before the standard debounce
    if (isRepeatingLastLetter && timeSinceLastLetter < 2000) {
      console.log(`🔁 DUPLICATE BLOCKED: "${letter}" already at end of word (${timeSinceLastLetter}ms ago, within 2s window)`);
      return {
        currentWord: this.currentWord,
        sentence: this.sentence,
        action: 'duplicate_blocked',
        correctedWord: null
      };
    }
    
    // Standard debounce: Ignore if same letter detected too quickly
    if (letter === this.lastLetter && timeSinceLastLetter < this.letterHoldTime) {
      console.log(`⏱️ DEBOUNCED: "${letter}" (only ${timeSinceLastLetter}ms since last, need ${this.letterHoldTime}ms)`);
      return {
        currentWord: this.currentWord,
        sentence: this.sentence,
        action: 'debounced',
        correctedWord: null
      };
    }

    // Special gestures
    if (letter === 'SPACE') {
      return this.addSpace();
    }
    
    if (letter === 'BACKSPACE' || letter === 'DELETE') {
      return this.backspace();
    }

    if (letter === 'CLEAR') {
      return this.clear();
    }

    // Add letter to current word
    if (/^[A-Z]$/i.test(letter)) {
      const lowerLetter = letter.toLowerCase();
      
      // Prevent more than 2 consecutive identical letters (except common double letters)
      const lastTwoLetters = this.currentWord.slice(-2);
      if (lastTwoLetters === lowerLetter + lowerLetter) {
        console.log(`🚫 Prevented triple letter: "${lowerLetter}" (already have "${lastTwoLetters}")`);
        return {
          currentWord: this.currentWord,
          sentence: this.sentence,
          action: 'triple_prevented',
          correctedWord: null
        };
      }
      
      this.currentWord += lowerLetter;
      this.lastLetter = letter;
      this.lastLetterTimestamp = now;

      console.log(`📝 Added letter: ${letter} → Current word: "${this.currentWord}"`);

      return {
        currentWord: this.currentWord,
        sentence: this.sentence,
        action: 'letter_added',
        correctedWord: null
      };
    }

    return {
      currentWord: this.currentWord,
      sentence: this.sentence,
      action: 'ignored',
      correctedWord: null
    };
  }

  /**
   * Add space - complete current word and add to sentence
   */
  addSpace() {
    console.log('🔵 addSpace called. Current word:', this.currentWord);
    
    if (this.currentWord.length === 0) {
      console.log('⚠️ No word to add (empty currentWord)');
      return {
        currentWord: this.currentWord,
        sentence: this.sentence,
        action: 'space_ignored',
        correctedWord: null
      };
    }

    // Auto-correct the word
    const correctedWord = this.autoCorrect(this.currentWord);
    console.log('🔧 Auto-correct result:', { original: this.currentWord, corrected: correctedWord });
    
    // Add to sentence
    if (this.sentence.length > 0) {
      this.sentence += ' ' + correctedWord;
    } else {
      // Capitalize first letter of sentence
      this.sentence = correctedWord.charAt(0).toUpperCase() + correctedWord.slice(1);
    }

    console.log(`✅ Word completed: "${this.currentWord}" → "${correctedWord}"`);
    console.log(`📄 Sentence now: "${this.sentence}"`);

    const result = {
      currentWord: '',
      sentence: this.sentence,
      action: 'word_completed',
      correctedWord: correctedWord !== this.currentWord ? correctedWord : null
    };

    this.currentWord = '';
    this.lastLetter = '';
    
    return result;
  }

  /**
   * Backspace - remove last letter from current word or last word from sentence
   */
  backspace() {
    if (this.currentWord.length > 0) {
      // Remove last letter from current word
      this.currentWord = this.currentWord.slice(0, -1);
      console.log(`⌫ Backspace: Current word now: "${this.currentWord}"`);
      
      return {
        currentWord: this.currentWord,
        sentence: this.sentence,
        action: 'letter_deleted',
        correctedWord: null
      };
    } else if (this.sentence.length > 0) {
      // Remove last word from sentence
      const words = this.sentence.split(' ');
      words.pop();
      this.sentence = words.join(' ');
      console.log(`⌫ Backspace: Removed last word. Sentence: "${this.sentence}"`);
      
      return {
        currentWord: this.currentWord,
        sentence: this.sentence,
        action: 'word_deleted',
        correctedWord: null
      };
    }

    return {
      currentWord: this.currentWord,
      sentence: this.sentence,
      action: 'backspace_ignored',
      correctedWord: null
    };
  }

  /**
   * Clear everything
   */
  clear() {
    this.currentWord = '';
    this.sentence = '';
    this.lastLetter = '';
    console.log('🗑️ Cleared all text');
    
    return {
      currentWord: '',
      sentence: '',
      action: 'cleared',
      correctedWord: null
    };
  }

  /**
   * Clear only the current word (keep sentence)
   */
  clearWord() {
    this.currentWord = '';
    this.lastLetter = '';
    console.log('🗑️ Cleared current word only');
    
    return {
      currentWord: '',
      sentence: this.sentence,
      action: 'word_cleared',
      correctedWord: null
    };
  }

  /**
   * Auto-correct a word using dictionary
   * @param {string} word - Word to correct
   * @returns {string} - Corrected word
   */
  autoCorrect(word) {
    const lowerWord = word.toLowerCase();
    
    // Check if it's in autocorrect dictionary (exact match for common misspellings)
    if (this.autoCorrectDict[lowerWord]) {
      console.log(`🔧 Auto-corrected: "${word}" → "${this.autoCorrectDict[lowerWord]}"`);
      return this.autoCorrectDict[lowerWord];
    }

    // Check if it's a common word (already correct)
    if (this.commonWords.has(lowerWord)) {
      return lowerWord;
    }

    // Try simple corrections for common patterns
    const simpleCorrection = this.simpleCorrect(lowerWord);
    if (simpleCorrection !== lowerWord) {
      console.log(`🔧 Pattern-corrected: "${word}" → "${simpleCorrection}"`);
      return simpleCorrection;
    }

    // Try fuzzy matching with Levenshtein distance
    const fuzzyMatch = this.findClosestWord(lowerWord);
    if (fuzzyMatch && fuzzyMatch !== lowerWord) {
      console.log(`🔧 Fuzzy-corrected: "${word}" → "${fuzzyMatch}"`);
      return fuzzyMatch;
    }

    // Return original if no correction found
    return lowerWord;
  }

  /**
   * Simple pattern-based corrections
   * @param {string} word - Word to correct
   * @returns {string} - Corrected word
   */
  simpleCorrect(word) {
    // Remove duplicate letters (common in ASL detection)
    // But keep intentional doubles like 'ee', 'oo', 'll', 'ss', 'tt'
    let corrected = word.replace(/(.)\1{2,}/g, '$1$1'); // Reduce 3+ repeats to 2

    // Fix common letter swaps in ASL (similar hand shapes)
    const swaps = {
      'ei': 'ie', // receive -> recieve (then corrected)
      'mn': 'nm',
      'nm': 'mn'
    };

    for (const [wrong, right] of Object.entries(swaps)) {
      if (corrected.includes(wrong)) {
        const candidate = corrected.replace(wrong, right);
        if (this.commonWords.has(candidate)) {
          return candidate;
        }
      }
    }

    return corrected;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {number} - Edit distance
   */
  levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    // Initialize first column
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    // Initialize first row
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Find closest word using fuzzy matching
   * @param {string} word - Word to match
   * @returns {string|null} - Closest matching word or null
   */
  findClosestWord(word) {
    // Only try fuzzy matching for words 3+ letters
    if (word.length < 3) return null;

    let closestWord = null;
    let minDistance = Infinity;
    const maxDistance = Math.ceil(word.length * 0.4); // Allow 40% error rate

    // Check autocorrect dictionary keys
    for (const dictWord of Object.keys(this.autoCorrectDict)) {
      const distance = this.levenshteinDistance(word, dictWord);
      if (distance <= maxDistance && distance < minDistance) {
        minDistance = distance;
        closestWord = this.autoCorrectDict[dictWord];
      }
    }

    // Check common words
    for (const commonWord of this.commonWords) {
      const distance = this.levenshteinDistance(word, commonWord);
      if (distance <= maxDistance && distance < minDistance) {
        minDistance = distance;
        closestWord = commonWord;
      }
    }

    return closestWord;
  }

  /**
   * Get current state
   * @returns {Object} - { currentWord, sentence, wordCount, letterCount }
   */
  getState() {
    return {
      currentWord: this.currentWord,
      sentence: this.sentence,
      wordCount: this.sentence.split(' ').filter(w => w.length > 0).length,
      letterCount: this.currentWord.length,
      totalCharacters: this.sentence.length + this.currentWord.length
    };
  }

  /**
   * Set sentence directly (for editing)
   * @param {string} sentence - New sentence
   */
  setSentence(sentence) {
    this.sentence = sentence;
    this.currentWord = '';
  }

  /**
   * Get final sentence with current word appended
   * @returns {string} - Complete text
   */
  getCompleteText() {
    if (this.currentWord.length > 0) {
      return this.sentence.length > 0 
        ? `${this.sentence} ${this.currentWord}`
        : this.currentWord;
    }
    return this.sentence;
  }
}

// Export singleton instance
const sentenceBuilder = new SentenceBuilder();
export default sentenceBuilder;
