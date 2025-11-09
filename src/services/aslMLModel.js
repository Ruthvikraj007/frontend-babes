/**
 * ASL ML Model Service
 * ====================
 * Loads and runs the CNN-LSTM model for ASL letter prediction
 * Works with MediaPipe hand landmarks (21 × 3 = 63 features)
 */

import * as tf from '@tensorflow/tfjs';

class ASLMLModel {
  constructor() {
    this.model = null;
    this.isLoaded = false;
    this.modelPath = '/models/asl-cnn-lstm/model.json';
    
    // A-Z letters
    this.letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    console.log('🧠 ASL ML Model Service initialized');
  }

  /**
   * Load the TensorFlow.js model
   */
  async initialize() {
    if (this.isLoaded) {
      console.log('✅ Model already loaded');
      return true;
    }

    try {
      console.log('📦 Loading CNN-LSTM model from:', this.modelPath);
      console.log('🔍 Full URL:', window.location.origin + this.modelPath);
      
      // Check if model file exists
      const modelResponse = await fetch(window.location.origin + this.modelPath);
      if (!modelResponse.ok) {
        throw new Error(`Model file not found: ${this.modelPath} (${modelResponse.status})`);
      }
      console.log('✅ Model JSON file found');
      
      // Try loading as LayersModel first
      try {
        console.log('🔄 Attempting to load as LayersModel...');
        this.model = await tf.loadLayersModel(this.modelPath);
        console.log('✅ Loaded as LayersModel');
      } catch (layersError) {
        console.warn('⚠️  LayersModel failed, trying GraphModel...', layersError.message);
        // Fallback to GraphModel if LayersModel fails
        this.model = await tf.loadGraphModel(this.modelPath);
        console.log('✅ Loaded as GraphModel');
      }

      this.isLoaded = true;
      
      console.log('✅ CNN-LSTM model loaded successfully!');
      console.log('   Model inputs:', this.model.inputs);
      console.log('   Model outputs:', this.model.outputs);
      
      // Warm up model with dummy prediction
      await this.warmUp();
      
      return true;
    } catch (error) {
      console.error('❌ Error loading model:', error.message);
      console.log('ℹ️  Falling back to angle-based detection (which works great!)');
      this.isLoaded = false;
      return false;
    }
  }

  /**
   * Warm up the model with a dummy prediction
   * This improves first real prediction speed
   */
  async warmUp() {
    try {
      console.log('🔥 Warming up model...');
      
      // Create dummy input (63 features)
      const dummyInput = tf.randomNormal([1, 63]);
      
      // Run prediction
      const prediction = this.model.predict(dummyInput);
      
      // Dispose tensors
      dummyInput.dispose();
      prediction.dispose();
      
      console.log('✅ Model warmed up and ready!');
    } catch (error) {
      console.warn('⚠️  Warm-up failed:', error);
    }
  }

  /**
   * Predict ASL letter from MediaPipe landmarks
   * @param {Array} landmarks - 21 landmarks with {x, y, z} coordinates
   * @returns {Object} - {letter, confidence, topPredictions}
   */
  async predict(landmarks) {
    if (!this.isLoaded || !this.model) {
      console.error('❌ Model not loaded. Call initialize() first.');
      return { letter: null, confidence: 0, topPredictions: [] };
    }

    try {
      // Flatten landmarks to 63 features
      const features = this.flattenLandmarks(landmarks);
      
      // Debug: Log feature range to verify normalization
      const minFeature = Math.min(...features);
      const maxFeature = Math.max(...features);
      console.log(`📊 Feature range: [${minFeature.toFixed(3)}, ${maxFeature.toFixed(3)}] (should be ~[0, 1])`);
      
      // Reshape flat array [63] into 3D structure [21, 3]
      // Model expects: (batch_size, landmarks, coordinates)
      const reshapedFeatures = [];
      for (let i = 0; i < 21; i++) {
        reshapedFeatures.push([
          features[i * 3],      // x
          features[i * 3 + 1],  // y
          features[i * 3 + 2]   // z
        ]);
      }
      
      // Create tensor as [1, 21, 3] (batch_size=1, landmarks=21, coordinates=3)
      const inputTensor = tf.tensor3d([reshapedFeatures]);
      
      // Run prediction
      const prediction = this.model.predict(inputTensor);
      const probabilities = await prediction.data();
      
      // Get top 3 predictions
      const topPredictions = this.getTopPredictions(probabilities, 3);
      
      // Debug: Log all top predictions
      console.log('🔝 Top 3 predictions:', topPredictions.map(p => `${p.letter}(${(p.confidence * 100).toFixed(1)}%)`).join(', '));
      
      // Best prediction
      const letter = topPredictions[0].letter;
      const confidence = topPredictions[0].confidence;
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();
      
      return {
        letter,
        confidence,
        topPredictions
      };
    } catch (error) {
      console.error('❌ Prediction error:', error);
      return { letter: null, confidence: 0, topPredictions: [] };
    }
  }

  /**
   * Flatten MediaPipe landmarks to 63 features
   * @param {Array} landmarks - Array of 21 landmarks with {x, y, z}
   * @returns {Array} - Flat array of 63 values
   */
  flattenLandmarks(landmarks) {
    const features = [];
    
    for (let i = 0; i < 21; i++) {
      if (landmarks[i]) {
        features.push(landmarks[i].x || 0);
        features.push(landmarks[i].y || 0);
        features.push(landmarks[i].z || 0);
      } else {
        // If landmark missing, use zeros
        features.push(0, 0, 0);
      }
    }
    
    return features;
  }

  /**
   * Get top N predictions with letters and confidence scores
   * @param {Array} probabilities - Softmax probabilities for 26 classes
   * @param {Number} topN - Number of top predictions to return
   * @returns {Array} - Array of {letter, confidence} objects
   */
  getTopPredictions(probabilities, topN = 3) {
    // Create array of {letter, confidence, index}
    const predictions = this.letters.map((letter, index) => ({
      letter,
      confidence: probabilities[index],
      index
    }));
    
    // Sort by confidence descending
    predictions.sort((a, b) => b.confidence - a.confidence);
    
    // Return top N
    return predictions.slice(0, topN);
  }

  /**
   * Batch predict multiple landmark sets
   * Useful for processing video frames
   * @param {Array} landmarksBatch - Array of landmark arrays
   * @returns {Array} - Array of prediction results
   */
  async batchPredict(landmarksBatch) {
    if (!this.isLoaded || !this.model) {
      console.error('❌ Model not loaded');
      return [];
    }

    try {
      // Flatten all landmarks
      const featuresBatch = landmarksBatch.map(lm => this.flattenLandmarks(lm));
      
      // Create tensor
      const inputTensor = tf.tensor2d(featuresBatch);
      
      // Run prediction
      const prediction = this.model.predict(inputTensor);
      const probabilities = await prediction.data();
      
      // Parse results
      const results = [];
      const batchSize = landmarksBatch.length;
      
      for (let i = 0; i < batchSize; i++) {
        const startIdx = i * 26;
        const batchProbs = Array.from(probabilities.slice(startIdx, startIdx + 26));
        const topPredictions = this.getTopPredictions(batchProbs, 3);
        
        results.push({
          letter: topPredictions[0].letter,
          confidence: topPredictions[0].confidence,
          topPredictions
        });
      }
      
      // Clean up
      inputTensor.dispose();
      prediction.dispose();
      
      return results;
    } catch (error) {
      console.error('❌ Batch prediction error:', error);
      return [];
    }
  }

  /**
   * Get model info
   */
  getModelInfo() {
    if (!this.isLoaded) {
      return { loaded: false };
    }

    return {
      loaded: true,
      path: this.modelPath,
      inputShape: [1, 63],
      outputClasses: 26,
      letters: this.letters,
      architecture: 'CNN-LSTM Hybrid'
    };
  }

  /**
   * Dispose model and free memory
   */
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.isLoaded = false;
      console.log('🗑️  Model disposed');
    }
  }
}

// Export singleton instance
const aslMLModel = new ASLMLModel();
export default aslMLModel;
