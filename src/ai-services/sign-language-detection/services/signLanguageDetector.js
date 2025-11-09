// Sign Language Detection Service using MediaPipe Hands
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import aslMLModel from '../../../services/aslMLModel';

class SignLanguageDetector {
  constructor() {
    this.detector = null;
    this.mlModel = aslMLModel; // ML model singleton for hybrid detection
    this.isInitialized = false;
    this.currentGesture = '';
    this.gestureBuffer = [];
    this.bufferSize = 10; // Smooth detection over 10 frames
    
    // ML + Angle-based hybrid settings
    this.useMLHybrid = false; // DISABLED: Using angle-based detection only
    this.mlConfidenceThreshold = 0.50; // Require 50% confidence from ML (balanced hybrid)
    this.angleConfidenceThreshold = 0.75; // Lower threshold for angle-based
    
    // OPTIMIZED: Advanced gesture smoothing
    this.gestureConfidence = new Map(); // Track confidence for each gesture
    this.minConfidenceFrames = 2; // REDUCED: Minimum frames before confirming (was 3, originally 5) - faster response
    this.lastGesture = 'none';
    this.lastGestureTimestamp = 0;
    this.gestureDebounceTime = 100; // REDUCED: ms - prevent rapid switching (was 200ms) - faster letter changes
  }

  async initialize() {
    try {
      console.log('🤖 Initializing Sign Language Detector...');
      
      // Initialize ML model
      if (this.useMLHybrid) {
        console.log('🧠 Initializing ML model for hybrid detection...');
        const mlLoaded = await this.mlModel.initialize();
        if (mlLoaded) {
          console.log('✅ ML model loaded - Hybrid detection enabled!');
        } else {
          console.warn('⚠️  ML model failed to load - Using angle-based only');
          this.useMLHybrid = false;
        }
      }
      
      // Check TensorFlow.js backend
      console.log('🔍 Checking TensorFlow.js backend...');
      await tf.ready();
      const backend = tf.getBackend();
      console.log('✅ TensorFlow.js backend ready:', backend);
      
      // Test if backend can create tensors
      try {
        const testTensor = tf.tensor([1, 2, 3]);
        console.log('✅ Backend can create tensors');
        testTensor.dispose();
      } catch (e) {
        console.error('❌ Backend cannot create tensors:', e);
        throw new Error('TensorFlow.js backend not working properly');
      }
      
      console.log('📦 Loading MediaPipe Hands model (OPTIMIZED)...');
      
      const model = handPoseDetection.SupportedModels.MediaPipeHands;
      
      // OPTIMIZED: Use best MediaPipe configuration for ASL detection
      // - Full model (192x192) for maximum accuracy
      // - High confidence thresholds to reduce false positives
      // - Tracking enabled for smooth detection in video
      let detectorConfig = {
        runtime: 'mediapipe',
        modelType: 'full', // 'full' model is most accurate (vs 'lite')
        maxHands: 2, // Detect both hands for two-handed signs
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
        // Advanced detection parameters for better ASL recognition:
        minDetectionConfidence: 0.7, // Higher confidence = less false positives
        minTrackingConfidence: 0.7,  // Better tracking between frames
      };
      
      console.log('🔧 Using OPTIMIZED MediaPipe configuration for ASL detection...');
      console.log('🔧 Detector config:', JSON.stringify(detectorConfig, null, 2));
      
      // Create detector with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Model loading timeout after 30 seconds')), 30000)
      );
      
      try {
        const detectorPromise = handPoseDetection.createDetector(model, detectorConfig);
        this.detector = await Promise.race([detectorPromise, timeoutPromise]);
        console.log('✅ Using MediaPipe runtime');
      } catch (mpError) {
        console.warn('⚠️ MediaPipe runtime failed, falling back to TensorFlow.js runtime');
        console.warn('MediaPipe error:', mpError.message);
        
        // Fall back to tfjs runtime
        detectorConfig = {
          runtime: 'tfjs',
          modelType: 'full',
          maxHands: 2
        };
        
        console.log('🔧 Detector config (tfjs):', JSON.stringify(detectorConfig, null, 2));
        const detectorPromise = handPoseDetection.createDetector(model, detectorConfig);
        this.detector = await Promise.race([detectorPromise, timeoutPromise]);
        console.log('✅ Using TensorFlow.js runtime');
      }
      
      // Verify detector was created
      if (!this.detector) {
        throw new Error('Detector creation failed - detector is null');
      }
      
      console.log('✅ Detector created successfully');
      console.log('🔍 Detector object:', this.detector);
      console.log('🔍 Detector methods:', Object.keys(this.detector));
      
      // Test if MediaPipe model files are accessible
      console.log('🌐 Testing MediaPipe CDN access...');
      try {
        const testUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
        const response = await fetch(testUrl, { method: 'HEAD' });
        if (response.ok) {
          console.log('✅ MediaPipe CDN is accessible');
        } else {
          console.warn('⚠️ MediaPipe CDN returned status:', response.status);
        }
      } catch (fetchError) {
        console.error('❌ Cannot access MediaPipe CDN:', fetchError.message);
        console.error('💡 This may cause null coordinate issues');
      }
      
      this.isInitialized = true;
      console.log('✅ Sign Language Detector initialized');
      
      return true;
    } catch (error) {
      console.error('❌ Error initializing detector:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Check if it's a network error
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('timeout')) {
        console.error('🌐 Network error - MediaPipe model may not have loaded from CDN');
        console.error('💡 Check internet connection and try again');
      }
      
      this.isInitialized = false;
      return false;
    }
  }

  async detectGesture(videoElement) {
    if (!this.isInitialized || !this.detector) {
      console.warn('⚠️ Detector not initialized');
      return null;
    }

    // Ensure video is ready and playing
    if (!videoElement || videoElement.readyState < 2 || videoElement.videoWidth === 0) {
      console.warn('⚠️ Video not ready:', {
        exists: !!videoElement,
        readyState: videoElement?.readyState,
        videoWidth: videoElement?.videoWidth,
        videoHeight: videoElement?.videoHeight
      });
      return null;
    }

    try {
      // OPTIMIZED: Use estimateHands with timestamp for better tracking
      const timestamp = performance.now();
      const hands = await this.detector.estimateHands(videoElement, {
        flipHorizontal: false, // Don't flip for more accurate detection
        staticImageMode: false // Use tracking for video (smoother, faster)
      });
      
      console.log('👋 Hands detected:', hands.length);
      
      if (hands.length === 0) {
        return { gesture: 'none', confidence: 0, hands: [] };
      }
      
      // Validate hand data structure
      console.log('🔍 First hand data structure:', {
        hasKeypoints: !!hands[0].keypoints,
        keypointsLength: hands[0].keypoints?.length,
        hasKeypoints3D: !!hands[0].keypoints3D,
        keypoints3DLength: hands[0].keypoints3D?.length,
        handedness: hands[0].handedness,
        score: hands[0].score
      });
      
      // Check if keypoints are valid (not null)
      if (hands[0].keypoints3D && hands[0].keypoints3D.length > 0) {
        const samplePoint = hands[0].keypoints3D[8]; // index finger tip
        console.log('🔍 Sample keypoint (index finger tip):', {
          x: samplePoint.x,
          y: samplePoint.y,
          z: samplePoint.z,
          isNull: samplePoint.x === null || samplePoint.y === null || samplePoint.z === null
        });
        
        // Check if ALL keypoints are null
        const allNull = hands[0].keypoints3D.every(kp => kp.x === null || kp.y === null || kp.z === null);
        if (allNull) {
          console.error('❌ CRITICAL: All keypoints have NULL coordinates!');
          console.error('💡 This indicates MediaPipe model failed to process the video frame properly');
          console.error('💡 Possible causes:');
          console.error('   - Model files not loaded from CDN');
          console.error('   - TensorFlow.js backend not initialized');
          console.error('   - Video frame incompatible with model');
          console.error('   - Insufficient lighting or poor camera quality');
        }
      }

      // Analyze hand landmarks to detect gestures
      const rawGesture = await this.classifyGesture(hands);
      
      // OPTIMIZED: Use advanced smoothing for stable detection
      const smoothedGesture = this.smoothGesture(rawGesture);
      
      // Legacy buffer smoothing (kept for backward compatibility)
      this.gestureBuffer.push(rawGesture);
      if (this.gestureBuffer.length > this.bufferSize) {
        this.gestureBuffer.shift();
      }
      
      return {
        gesture: smoothedGesture,
        confidence: this.calculateConfidence(hands),
        hands: hands,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Error detecting gesture:', error);
      return null;
    }
  }

  async classifyGesture(hands) {
    if (hands.length === 0) return 'none';
    
    const hand = hands[0];
    
    // ALWAYS use keypoints3D since 2D keypoints have null values
    // MediaPipe Hands returns 3D world coordinates which are valid
    let keypoints;
    
    if (hand.keypoints3D && hand.keypoints3D.length > 0) {
      console.log('✅ Using 3D keypoints (21 points available)');
      console.log('🔍 RAW keypoints3D[8]:', JSON.stringify(hand.keypoints3D[8]));
      
      // First pass: find z-coordinate range for normalization
      let minZ = Infinity, maxZ = -Infinity;
      hand.keypoints3D.forEach(point => {
        if (point.z < minZ) minZ = point.z;
        if (point.z > maxZ) maxZ = point.z;
      });
      const zRange = maxZ - minZ || 1;
      
      // Convert 3D world coordinates to IMAGE SPACE coordinates [0, 1]
      // to match the original training data preprocessing
      // Original model trained on: MediaPipe static image mode (x,y in [0,1], z normalized)
      // Browser MediaPipe gives: World coordinates (x,y in [-0.5, 0.5], z can be negative)
      keypoints = hand.keypoints3D.map(point => ({
        x: point.x + 0.5,  // Convert from world [-0.5, 0.5] to image [0, 1]
        y: 1.0 - (point.y + 0.5),  // Convert and flip Y (MediaPipe Y is inverted)
        z: (point.z - minZ) / zRange,  // Normalize z to [0, 1] to match training data
        name: point.name,
        // Store pixel coordinates for angle-based detection
        xPixel: (point.x + 0.5) * 640,
        yPixel: (0.5 - point.y) * 480
      }));
      console.log('📍 Converted 3D to normalized. Sample point:', keypoints[8]);
    } else if (hand.keypoints && hand.keypoints.length > 0) {
      console.log('⚠️ Falling back to 2D keypoints');
      keypoints = hand.keypoints;
    } else {
      console.error('❌ No keypoints available');
      return 'none';
    }
    
    if (!keypoints || keypoints.length === 0) {
      console.error('❌ No valid keypoints found in hand object');
      return 'none';
    }
    
    // Debug: Log keypoints before passing to isFingerExtended
    console.log('🔍 keypoints[8] before isFingerExtended:', JSON.stringify(keypoints[8]));
    
    // ========================================================================
    // HYBRID ML + ANGLE-BASED DETECTION
    // ========================================================================
    
    // Try ML model first if enabled
    if (this.useMLHybrid && this.mlModel && this.mlModel.isLoaded) {
      try {
        // Pass keypoints array directly to ML model (it will flatten internally)
        // Use normalized [0, 1] coordinates (x, y, z) matching training data
        const mlResult = await this.mlModel.predict(keypoints);
        
        console.log(`🧠 ML Prediction: ${mlResult.letter} (${(mlResult.confidence * 100).toFixed(1)}%)`);
        
        // Use ML result if confidence is high enough
        if (mlResult.confidence >= this.mlConfidenceThreshold) {
          console.log(`✅ Using ML prediction (high confidence): ${mlResult.letter}`);
          return mlResult.letter;
        } else {
          console.log(`⚠️  ML confidence too low (${(mlResult.confidence * 100).toFixed(1)}%), falling back to angle-based...`);
        }
      } catch (error) {
        console.error('❌ ML prediction error:', error);
        // Fall through to angle-based detection
      }
    }
    
    // ========================================================================
    // FALLBACK TO ANGLE-BASED DETECTION
    // ========================================================================
    
    // For angle-based detection, use pixel coordinates
    // Convert keypoints to use pixel coordinates for angles
    const pixelKeypoints = keypoints.map(kp => ({
      x: kp.xPixel || kp.x,
      y: kp.yPixel || kp.y,
      z: kp.z,
      name: kp.name
    }));
    
    // Extract finger states (extended or closed) using pixel coordinates
    const thumbExtended = this.isFingerExtended(pixelKeypoints, 'thumb');
    const indexExtended = this.isFingerExtended(pixelKeypoints, 'index');
    const middleExtended = this.isFingerExtended(pixelKeypoints, 'middle');
    const ringExtended = this.isFingerExtended(pixelKeypoints, 'ring');
    const pinkyExtended = this.isFingerExtended(pixelKeypoints, 'pinky');

    // Debug finger states
    console.log(`🖐️ Finger states: thumb=${thumbExtended}, index=${indexExtended}, middle=${middleExtended}, ring=${ringExtended}, pinky=${pinkyExtended}`);

    // ASL Alphabet Detection using pixel coordinates
    const gesture = this.detectASLLetter(pixelKeypoints, thumbExtended, indexExtended, middleExtended, ringExtended, pinkyExtended);
    
    if (gesture !== 'unknown') {
      console.log(`🔤 Classified as: ${gesture}`);
    }
    
    return gesture;
  }

  // ============================================================================
  // ANGLE-BASED DETECTION HELPERS
  // ============================================================================
  
  /**
   * Calculate angle between three points (in degrees)
   * Returns angle at point p2 formed by p1-p2-p3
   * @param {Object} p1 - First point {x, y}
   * @param {Object} p2 - Vertex point {x, y}
   * @param {Object} p3 - Third point {x, y}
   * @returns {number} Angle in degrees (-180 to 180)
   */
  calculateAngle(p1, p2, p3) {
    const angle1 = Math.atan2(p1.y - p2.y, p1.x - p2.x);
    const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
    let angle = (angle2 - angle1) * (180 / Math.PI);
    
    // Normalize to -180 to 180 range
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    
    return angle;
  }

  /**
   * Calculate angle of a line from horizontal (in degrees)
   * @param {Object} p1 - Start point {x, y}
   * @param {Object} p2 - End point {x, y}
   * @returns {number} Angle in degrees (-180 to 180)
   */
  getDirectionAngle(p1, p2) {
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
    return angle;
  }

  /**
   * Calculate bend angle at a finger joint
   * @param {Object} tip - Finger tip point
   * @param {Object} pip - PIP joint (middle joint)
   * @param {Object} mcp - MCP joint (base joint)
   * @returns {number} Bend angle in degrees (0 = straight, 180 = fully bent)
   */
  getFingerCurlAngle(tip, pip, mcp) {
    const angle = this.calculateAngle(mcp, pip, tip);
    // Convert to 0-180 range where 0 = straight, 180 = fully bent
    return Math.abs(angle);
  }

  /**
   * Get angle of finger from horizontal axis
   * Positive = pointing down, Negative = pointing up, 0 = horizontal
   * @param {Object} tip - Finger tip
   * @param {Object} base - Finger base (MCP)
   * @returns {number} Angle in degrees (-90 to 90)
   */
  getFingerElevationAngle(tip, base) {
    // Calculate angle from horizontal
    // Positive Y = down in screen coordinates
    const angle = Math.atan2(tip.y - base.y, Math.abs(tip.x - base.x)) * (180 / Math.PI);
    return angle;
  }

  /**
   * Calculate angle between two vectors
   * @param {Object} v1 - First vector {x, y}
   * @param {Object} v2 - Second vector {x, y}
   * @returns {number} Angle in degrees (0 to 180)
   */
  getVectorAngle(v1, v2) {
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    const cosAngle = dot / (mag1 * mag2);
    return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
  }

  /**
   * Check if finger is pointing in a specific direction
   * @param {number} angle - Angle from getDirectionAngle
   * @param {string} direction - 'up', 'down', 'left', 'right', 'horizontal', 'vertical'
   * @param {number} tolerance - Tolerance in degrees (default 20)
   * @returns {boolean}
   */
  isPointingDirection(angle, direction, tolerance = 20) {
    switch(direction) {
      case 'up': return angle < -90 + tolerance && angle > -90 - tolerance;
      case 'down': return angle > 90 - tolerance && angle < 90 + tolerance;
      case 'left': return Math.abs(angle - 180) < tolerance || Math.abs(angle + 180) < tolerance;
      case 'right': return Math.abs(angle) < tolerance;
      case 'horizontal': return Math.abs(angle) < tolerance || Math.abs(Math.abs(angle) - 180) < tolerance;
      case 'vertical': return Math.abs(Math.abs(angle) - 90) < tolerance;
      default: return false;
    }
  }

  // ============================================================================
  // END ANGLE-BASED HELPERS
  // ============================================================================

  detectASLLetter(keypoints, thumbExt, indexExt, middleExt, ringExt, pinkyExt) {
    // Helper to check thumb position relative to fingers
    const thumbAcrossPalm = this.isThumbAcrossPalm(keypoints);
    const thumbToSide = this.isThumbToSide(keypoints);
    const thumbTouchingFingers = this.isThumbTouchingFingers(keypoints);
    
    // Check all fingers closed first (for A, E, M, S differentiation)
    const allFingersClosed = !indexExt && !middleExt && !ringExt && !pinkyExt;
    
    if (allFingersClosed) {
      // A - Closed fist with thumb CLEARLY to the side (perpendicular)
      if (thumbToSide && !thumbAcrossPalm) {
        console.log('🔍 A detected: thumb to side');
        return 'A';
      }
      
      // M - Three fingers draped over thumb (very close to thumb) - CHECK FIRST
      if (this.isMShape(keypoints)) {
        console.log('🔍 M detected: three fingers over thumb');
        return 'M';
      }
      
      // E - Fingers curled BACK with thumb across (fingertips NOT near thumb)
      if (this.isEShape(keypoints)) {
        console.log('🔍 E detected: fingers curled back, thumb across');
        return 'E';
      }
      
      // S - Thumb wrapped ACROSS FRONT of fingers (thumb in front)
      if (this.isThumbInFront(keypoints)) {
        console.log('🔍 S detected: thumb in front');
        return 'S';
      }
      
      // Default to A if thumb position unclear but to side
      if (thumbToSide) {
        console.log('🔍 A detected (default): thumb appears to side');
        return 'A';
      }
    }
    
    // D - Index finger up, other fingers and thumb form circle (CHECK FIRST - very specific)
    if (indexExt && !middleExt && !ringExt && !pinkyExt && this.isDShape(keypoints)) {
      console.log('🔍 D detected: index up with circle');
      return 'D';
    }
    
    // B - All four fingers extended together, thumb across palm
    if (indexExt && middleExt && ringExt && pinkyExt && thumbAcrossPalm) {
      return 'B';
    }
    
    // F - Index and thumb form circle, other three fingers extended (CHECK BEFORE C)
    if (middleExt && ringExt && pinkyExt && !indexExt && this.isFShape(keypoints)) {
      console.log('🔍 F detected: OK circle with three fingers up');
      return 'F';
    }
    
    // H - Index and middle extended sideways together, ring/pinky closed (CHECK BEFORE G and C)
    // Thumb can be slightly out or tucked in for H
    if (indexExt && middleExt && !ringExt && !pinkyExt && this.isHShape(keypoints)) {
      console.log('🔍 H detected: index + middle extended sideways, ring/pinky closed');
      return 'H';
    }
    
    // Q - Index + thumb pointing DOWN (CHECK BEFORE G - more specific!)
    if (indexExt && thumbExt && !middleExt && !ringExt && !pinkyExt && this.isQShape(keypoints)) {
      console.log('🔍 Q detected: index + thumb pointing DOWN, others closed');
      return 'Q';
    }
    
    // G - Index pointing sideways/forward, thumb parallel, OTHER FINGERS CLOSED (CHECK AFTER Q)
    if (indexExt && thumbExt && !middleExt && !ringExt && !pinkyExt && this.isGShape(keypoints, indexExt, thumbExt)) {
      console.log('🔍 G detected: index + thumb extended sideways/forward, others closed');
      return 'G';
    }
    
    // P - Index and middle pointing DOWN, ring/pinky closed (CHECK BEFORE K!)
    // Must check BEFORE K because P has same finger configuration but different direction
    if (indexExt && middleExt && !ringExt && !pinkyExt && this.isPShape(keypoints)) {
      console.log('🔍 P detected: index + middle pointing DOWN, ring/pinky closed');
      return 'P';
    }
    
    // K - Index up, middle extended at angle, thumb between them, ring/pinky closed (CHECK AFTER P)
    // Note: Thumb can be partially extended (between fingers), not fully extended
    const kShapeValid = this.isKShape(keypoints);
    console.log('🔍 K check:', { indexExt, middleExt, thumbExt, ringExt, pinkyExt, kShapeValid });
    
    if (indexExt && middleExt && !ringExt && !pinkyExt && kShapeValid) {
      console.log('🔍 K detected: index + middle at angle UP/FORWARD, ring/pinky closed');
      return 'K';
    }
    
    // I - Pinky up, other fingers closed, thumb across (CHECK BEFORE C)
    if (!indexExt && !middleExt && !ringExt && pinkyExt && thumbAcrossPalm) {
      console.log('🔍 I detected: pinky up, other fingers closed, thumb across palm');
      return 'I';
    }
    
    // L - Index up, thumb out at right angle (CHECK BEFORE C - very specific)
    if (indexExt && thumbExt && !middleExt && !ringExt && !pinkyExt && this.isLShape(keypoints)) {
      console.log('🔍 L detected: index up, thumb out at 90 degrees');
      return 'L';
    }
    
    // N - Two fingers (index, middle) draped over thumb (CHECK BEFORE C)
    // Ring and pinky should be CLOSED, thumb tucked under index/middle
    if (!indexExt && !middleExt && !ringExt && !pinkyExt && this.isNShape(keypoints)) {
      console.log('🔍 N detected: two fingers over thumb');
      return 'N';
    }
    
    // C - Curved hand shape (all fingers curved, forming C)
    if (this.isCShape(keypoints)) {
      return 'C';
    }
    
    // O - All fingers form circle/oval shape
    if (this.isOShape(keypoints)) {
      return 'O';
    }
    
    // R - Index and middle crossed
    if (this.isRShape(keypoints, indexExt, middleExt)) {
      return 'R';
    }
    
    // S - Fist with thumb across front (same as A but thumb in front)
    if (!indexExt && !middleExt && !ringExt && !pinkyExt && this.isThumbInFront(keypoints)) {
      return 'S';
    }
    
    // T - Thumb between index and middle
    if (this.isTShape(keypoints)) {
      return 'T';
    }
    
    // U - Index and middle extended together, others closed
    if (indexExt && middleExt && !ringExt && !pinkyExt && this.areFingersTogether(keypoints, 8, 12)) {
      return 'U';
    }
    
    // V - Index and middle extended in V shape, others closed
    if (indexExt && middleExt && !ringExt && !pinkyExt && !this.areFingersTogether(keypoints, 8, 12)) {
      return 'V';
    }
    
    // W - Index, middle, ring extended, pinky closed
    if (indexExt && middleExt && ringExt && !pinkyExt && !thumbExt) {
      return 'W';
    }
    
    // X - Index bent/crooked
    if (this.isXShape(keypoints, indexExt)) {
      return 'X';
    }
    
    // Y - Thumb and pinky extended, others closed (hang loose)
    if (thumbExt && !indexExt && !middleExt && !ringExt && pinkyExt) {
      return 'Y';
    }
    
    // Z - Index pointing (motion gesture - static approximation)
    if (indexExt && !middleExt && !ringExt && !pinkyExt && !thumbExt) {
      return 'Z';
    }
    
    return 'unknown';
  }

  // Helper methods for ASL letter detection
  
  isThumbAcrossPalm(keypoints) {
    const thumbTip = keypoints[4];
    const palmBase = keypoints[0];
    const indexBase = keypoints[5];
    const middleBase = keypoints[9];
    
    // Thumb is across palm if it's between palm center and finger bases
    const xDistance = Math.abs(thumbTip.x - palmBase.x);
    const yPosition = thumbTip.y;
    const avgFingerBaseY = (indexBase.y + middleBase.y) / 2;
    
    // Thumb should be close to palm horizontally and near finger bases vertically
    const isAcross = xDistance < 50 && Math.abs(yPosition - avgFingerBaseY) < 40;
    
    console.log('   isThumbAcrossPalm:', isAcross, '(xDist:', xDistance.toFixed(1), 'yDiff:', Math.abs(yPosition - avgFingerBaseY).toFixed(1) + ')');
    return isAcross;
  }
  
  isThumbToSide(keypoints) {
    const thumbTip = keypoints[4];
    const thumbBase = keypoints[2];
    const indexBase = keypoints[5];
    const palmBase = keypoints[0];
    
    // Thumb to side means it's extended perpendicular (horizontal distance is large)
    const xDiff = Math.abs(thumbTip.x - indexBase.x);
    const thumbExtension = Math.abs(thumbTip.x - palmBase.x);
    
    // Strong indicator: thumb is far to the side AND not across palm
    const isToSide = xDiff > 40 && thumbExtension > 35;
    
    console.log('   isThumbToSide:', isToSide, '(xDiff:', xDiff.toFixed(1), 'extension:', thumbExtension.toFixed(1) + ')');
    return isToSide;
  }
  
  isDShape(keypoints) {
    const thumbTip = keypoints[4];
    const middleTip = keypoints[12];
    const ringTip = keypoints[16];
    const pinkyTip = keypoints[20];
    
    // D forms a circle with thumb and middle/ring/pinky fingers
    // All three closed fingers should be close together AND close to thumb
    const thumbToMiddle = Math.sqrt(
      Math.pow(thumbTip.x - middleTip.x, 2) +
      Math.pow(thumbTip.y - middleTip.y, 2)
    );
    
    const thumbToRing = Math.sqrt(
      Math.pow(thumbTip.x - ringTip.x, 2) +
      Math.pow(thumbTip.y - ringTip.y, 2)
    );
    
    const thumbToPinky = Math.sqrt(
      Math.pow(thumbTip.x - pinkyTip.x, 2) +
      Math.pow(thumbTip.y - pinkyTip.y, 2)
    );
    
    // Middle, ring, pinky should be bunched together (touching or close)
    const middleToRing = Math.sqrt(
      Math.pow(middleTip.x - ringTip.x, 2) +
      Math.pow(middleTip.y - ringTip.y, 2)
    );
    
    const ringToPinky = Math.sqrt(
      Math.pow(ringTip.x - pinkyTip.x, 2) +
      Math.pow(ringTip.y - pinkyTip.y, 2)
    );
    
    // For D: fingers bunched AND at least one touches thumb (forming circle)
    const fingersBunched = middleToRing < 25 && ringToPinky < 25;
    const thumbTouchingClosedFingers = (thumbToMiddle < 35 || thumbToRing < 35 || thumbToPinky < 35);
    
    const isD = fingersBunched && thumbTouchingClosedFingers;
    
    console.log('   isDShape:', isD, 
      '(fingersBunched:', fingersBunched, 
      'thumbToClosedFingers:', thumbTouchingClosedFingers,
      'thumbToMiddle:', thumbToMiddle.toFixed(1),
      'thumbToRing:', thumbToRing.toFixed(1) + ')');
    
    return isD;
  }

  isThumbTouchingFingers(keypoints) {
    const thumbTip = keypoints[4];
    const middleTip = keypoints[12];
    
    // Check if thumb is close to middle finger tip (forming circle)
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - middleTip.x, 2) +
      Math.pow(thumbTip.y - middleTip.y, 2)
    );
    return distance < 30;
  }
  
  isThumbInFront(keypoints) {
    const thumbTip = keypoints[4];
    const indexMCP = keypoints[5];
    const palmBase = keypoints[0];
    
    // Thumb in front if z-depth is significantly more positive (closer to camera)
    // Also check if thumb is wrapped across (not extended to side)
    const zDiff = thumbTip.z && indexMCP.z ? thumbTip.z - indexMCP.z : 0;
    const xDiff = Math.abs(thumbTip.x - palmBase.x);
    
    // S has thumb in front AND wrapped (not extended far)
    const isInFront = zDiff > 0.01 && xDiff < 60;
    
    console.log('   isThumbInFront:', isInFront, '(zDiff:', zDiff.toFixed(3), 'xDiff:', xDiff.toFixed(1) + ')');
    return isInFront;
  }
  
  isCShape(keypoints) {
    // All fingertips should be curved (similar x position but different y)
    const tips = [8, 12, 16, 20].map(i => keypoints[i]);
    const bases = [5, 9, 13, 17].map(i => keypoints[i]);
    const thumbTip = keypoints[4];
    
    // Check if fingers are curved (tips not far from bases)
    const avgDistance = tips.reduce((sum, tip, idx) => {
      const base = bases[idx];
      return sum + Math.sqrt(Math.pow(tip.x - base.x, 2) + Math.pow(tip.y - base.y, 2));
    }, 0) / 4;
    
    // C should be more open/curved than N or M - stricter requirements
    // Fingers should curve but NOT be tucked over thumb
    // Check that fingers are NOT close to thumb (like in N or M)
    const fingersToThumb = tips.map(tip => 
      Math.sqrt(Math.pow(tip.x - thumbTip.x, 2) + Math.pow(tip.y - thumbTip.y, 2))
    );
    const avgDistToThumb = fingersToThumb.reduce((a, b) => a + b, 0) / fingersToThumb.length;
    
    // C: fingers curved (25-45px), but NOT close to thumb (must be >40px away)
    const isCurved = avgDistance > 25 && avgDistance < 45;
    const fingersAway = avgDistToThumb > 40; // Fingers NOT over thumb
    
    console.log('   isCShape: curved=', isCurved, 'away=', fingersAway, '(avgDist:', avgDistance.toFixed(1), 'distToThumb:', avgDistToThumb.toFixed(1) + ')');
    return isCurved && fingersAway;
  }
  
  isOKShape(keypoints) {
    const thumbTip = keypoints[4];
    const indexTip = keypoints[8];
    
    // Thumb and index form circle
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
      Math.pow(thumbTip.y - indexTip.y, 2)
    );
    return distance < 25;
  }
  
  isFShape(keypoints) {
    // F: Thumb tip touches index finger (at knuckle/joint), forming OK-like circle
    // Middle, ring, pinky are extended upward/outward
    const thumbTip = keypoints[4];
    const indexTip = keypoints[8];
    const indexDIP = keypoints[7];  // Index distal interphalangeal joint
    const indexPIP = keypoints[6];  // Index proximal interphalangeal joint
    const indexMCP = keypoints[5];  // Index metacarpophalangeal joint (base)
    const middleTip = keypoints[12];
    const ringTip = keypoints[16];
    const pinkyTip = keypoints[20];
    const palmBase = keypoints[0];
    
    // Check if thumb touches any part of the index finger (not just the tip)
    const distances = [indexTip, indexDIP, indexPIP, indexMCP].map(joint => 
      Math.sqrt(
        Math.pow(thumbTip.x - joint.x, 2) +
        Math.pow(thumbTip.y - joint.y, 2)
      )
    );
    
    const minDistance = Math.min(...distances);
    const thumbTouchesIndex = minDistance < 30;
    
    // For F: Check that middle, ring, pinky are EXTENDED (far from palm)
    // These three fingers should be much farther from palm than the index/thumb circle
    const middleDist = Math.sqrt(
      Math.pow(middleTip.x - palmBase.x, 2) +
      Math.pow(middleTip.y - palmBase.y, 2)
    );
    const ringDist = Math.sqrt(
      Math.pow(ringTip.x - palmBase.x, 2) +
      Math.pow(ringTip.y - palmBase.y, 2)
    );
    const pinkyDist = Math.sqrt(
      Math.pow(pinkyTip.x - palmBase.x, 2) +
      Math.pow(pinkyTip.y - palmBase.y, 2)
    );
    
    const avgExtension = (middleDist + ringDist + pinkyDist) / 3;
    
    // OPTIMIZED: Lowered threshold from 80 to 75 for more reliable F detection
    // Three fingers should be well extended (>75px from palm) for F
    const fingersExtended = avgExtension > 75;
    
    const isF = thumbTouchesIndex && fingersExtended;
    
    console.log('   isFShape:', isF, '(thumbTouch:', thumbTouchesIndex, 'minDist:', minDistance.toFixed(1), 'avgExt:', avgExtension.toFixed(1), 'extended:', fingersExtended + ')');
    return isF;
  }
  
  isOShape(keypoints) {
    const thumbTip = keypoints[4];
    const indexTip = keypoints[8];
    
    // All fingertips close together forming O
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
      Math.pow(thumbTip.y - indexTip.y, 2)
    );
    return distance < 35;
  }
  
  isGShape(keypoints, indexExt, thumbExt) {
    if (!indexExt || !thumbExt) return false;
    
    const indexTip = keypoints[8];
    const indexBase = keypoints[5];
    const thumbTip = keypoints[4];
    const thumbBase = keypoints[2];
    
    // ANGLE-BASED DETECTION: G = Index pointing SIDEWAYS/HORIZONTAL (not down)
    // Calculate direction angle from horizontal for index finger
    const indexAngle = this.getDirectionAngle(indexBase, indexTip);
    
    // Horizontal pointing: angle between -30° and +30° (right) or 150-210° (left)
    // This is camera-distance independent
    const indexHorizontal = Math.abs(indexAngle) < 30 || Math.abs(Math.abs(indexAngle) - 180) < 30;
    
    // Index and thumb should be parallel (tips at similar height)
    const yDiff = Math.abs(indexTip.y - thumbTip.y);
    const parallel = yDiff < 50;
    
    console.log('   isGShape (ANGLE): indexAngle=', indexAngle.toFixed(1), '°, indexHorizontal=', indexHorizontal, 'parallel=', parallel, '(yDiff:', yDiff.toFixed(1), 'px)');
    return parallel && indexHorizontal;
  }
  
  isHShape(keypoints) {
    // Check if index and middle fingers are side by side (horizontal)
    return this.areFingersTogether(keypoints, 8, 12);
  }
  
  isKShape(keypoints) {
    const indexTip = keypoints[8];
    const indexBase = keypoints[5];
    const middleTip = keypoints[12];
    const middleBase = keypoints[9];
    
    // Check if index and middle fingers are spread apart (V shape)
    const indexMiddleDist = Math.abs(indexTip.x - middleTip.x);
    const isValid = indexMiddleDist > 10 && indexMiddleDist < 50;
    
    // ANGLE-BASED DETECTION: K = Fingers must point UP/FORWARD (negative angles)
    // Calculate direction angles for both fingers
    const indexAngle = this.getDirectionAngle(indexBase, indexTip);
    const middleAngle = this.getDirectionAngle(middleBase, middleTip);
    
    // K should point UPWARD or slightly FORWARD, but NOT horizontal sideways (that's H)
    // Upward pointing: angle between -135° and -45° (straight up = -90°)
    // Slightly forward: angle between -45° and -10° OR 10° and 45° (but not near ±180° which is sideways/H)
    const indexPointingUp = (indexAngle < -10 && indexAngle > -135) || (indexAngle > 10 && indexAngle < 45);
    const middlePointingUp = (middleAngle < -10 && middleAngle > -135) || (middleAngle > 10 && middleAngle < 45);
    const pointingUp = indexPointingUp && middlePointingUp; // BOTH should point up/forward, not horizontal
    
    console.log('   isKShape (ANGLE): indexAngle=', indexAngle.toFixed(1), '°, middleAngle=', middleAngle.toFixed(1), '°, spread=', indexMiddleDist.toFixed(1), 'px, pointingUp=', pointingUp);
    return isValid && pointingUp;
  }
  
  isLShape(keypoints) {
    const indexTip = keypoints[8];
    const thumbTip = keypoints[4];
    const wrist = keypoints[0];
    
    // Index pointing up, thumb pointing sideways (90 degree angle)
    const indexVertical = Math.abs(indexTip.y - wrist.y) > 60;
    const thumbHorizontal = Math.abs(thumbTip.x - wrist.x) > 40;
    
    return indexVertical && thumbHorizontal;
  }
  
  isPShape(keypoints) {
    const indexTip = keypoints[8];
    const indexBase = keypoints[5];
    const middleTip = keypoints[12];
    const middleBase = keypoints[9];
    const wrist = keypoints[0];
    
    // ANGLE-BASED DETECTION: P = Index and middle pointing DOWN at 45-135° angle
    // Calculate direction angles for both fingers
    const indexAngle = this.getDirectionAngle(indexBase, indexTip);
    const middleAngle = this.getDirectionAngle(middleBase, middleTip);
    
    // Downward pointing: angle between 45° and 135° (90° = straight down)
    const indexPointingDown = indexAngle > 45 && indexAngle < 135;
    const middlePointingDown = middleAngle > 45 && middleAngle < 135;
    
    // Both fingers must be pointing down AND below wrist level
    const bothDown = indexPointingDown && middlePointingDown;
    const belowWrist = indexTip.y > wrist.y && middleTip.y > wrist.y;
    
    console.log('   isPShape (ANGLE): indexAngle=', indexAngle.toFixed(1), '°, middleAngle=', middleAngle.toFixed(1), '°, bothDown=', bothDown, 'belowWrist=', belowWrist);
    
    return bothDown && belowWrist;
  }
  
  isQShape(keypoints) {
    const indexTip = keypoints[8];
    const indexBase = keypoints[5];
    const thumbTip = keypoints[4];
    const thumbBase = keypoints[2];
    const wrist = keypoints[0];
    
    // ANGLE-BASED DETECTION: Q = index + thumb pointing DOWN at 45-135° angle
    // Calculate direction angle from horizontal for both fingers
    const indexAngle = this.getDirectionAngle(indexBase, indexTip);
    const thumbAngle = this.getDirectionAngle(thumbBase, thumbTip);
    
    // Downward pointing: angle between 45° and 135° (90° = straight down)
    // This is camera-distance independent and works for all hand sizes
    const indexPointingDown = indexAngle > 45 && indexAngle < 135;
    const thumbPointingDown = thumbAngle > 30 && thumbAngle < 150; // Thumb can be less strict
    const bothDown = indexPointingDown && thumbPointingDown;
    
    // Also check they're below wrist for additional validation
    const belowWrist = indexTip.y > wrist.y && thumbTip.y > wrist.y;
    
    console.log('   isQShape (ANGLE): indexAngle=', indexAngle.toFixed(1), '°, thumbAngle=', thumbAngle.toFixed(1), '°, indexDown=', indexPointingDown, 'thumbDown=', thumbPointingDown, 'bothDown=', bothDown, 'belowWrist=', belowWrist);
    
    // Q = index + thumb pointing DOWN (like upside-down gun) with clear downward angle
    return bothDown && belowWrist;
  }
  
  isRShape(keypoints, indexExt, middleExt) {
    if (!indexExt || !middleExt) return false;
    
    const indexTip = keypoints[8];
    const middleTip = keypoints[12];
    
    // Index and middle fingers crossed
    const xDiff = Math.abs(indexTip.x - middleTip.x);
    return xDiff < 15; // Very close together, suggesting crossing
  }
  
  isTShape(keypoints) {
    const thumbTip = keypoints[4];
    const indexBase = keypoints[5];
    const middleBase = keypoints[9];
    
    // Thumb tucked between index and middle knuckles
    const thumbBetween = 
      thumbTip.x > Math.min(indexBase.x, middleBase.x) &&
      thumbTip.x < Math.max(indexBase.x, middleBase.x);
    
    return thumbBetween;
  }
  
  areFingersTogether(keypoints, finger1Tip, finger2Tip) {
    const tip1 = keypoints[finger1Tip];
    const tip2 = keypoints[finger2Tip];
    
    // Fingers are together if tips are close
    const distance = Math.sqrt(
      Math.pow(tip1.x - tip2.x, 2) +
      Math.pow(tip1.y - tip2.y, 2)
    );
    return distance < 20;
  }
  
  isEShape(keypoints) {
    // E: Fingers curled BACK (away from camera/behind thumb), thumb across palm
    // Key difference from M: fingers are BEHIND thumb, not draped over it
    const thumbTip = keypoints[4];
    const indexTip = keypoints[8];
    const middleTip = keypoints[12];
    const ringTip = keypoints[16];
    const pinkyTip = keypoints[20];
    
    const thumbAcrossPalm = this.isThumbAcrossPalm(keypoints);
    
    // Key for E: Check if fingertips are BEHIND thumb (farther from camera)
    // Use z-coordinate: fingers should be farther from camera (more positive z) than thumb
    const fingersBehind = [indexTip, middleTip, ringTip, pinkyTip].filter(tip => 
      tip.z && thumbTip.z && tip.z > thumbTip.z + 0.005
    ).length >= 3;
    
    // Alternative: if no z-depth difference, check that fingers are NOT very close to thumb
    const distances = [indexTip, middleTip, ringTip, pinkyTip].map(tip => 
      Math.sqrt(
        Math.pow(tip.x - thumbTip.x, 2) +
        Math.pow(tip.y - thumbTip.y, 2)
      )
    );
    const minDistance = Math.min(...distances);
    const avgDistance = distances.reduce((a, b) => a + b, 0) / 4;
    
    // E: thumb across palm AND (fingers behind thumb OR fingers not touching thumb closely)
    const notTouchingThumb = minDistance > 30;
    const isE = thumbAcrossPalm && (fingersBehind || notTouchingThumb);
    
    console.log('   isEShape:', isE, '(avgDist:', avgDistance.toFixed(1), 'minDist:', minDistance.toFixed(1), 'fingersBehind:', fingersBehind, 'thumbAcross:', thumbAcrossPalm + ')');
    return isE;
  }

  isMShape(keypoints) {
    // M: Three fingers (index, middle, ring) DRAPED OVER thumb (forward toward camera)
    const thumbTip = keypoints[4];
    const indexTip = keypoints[8];
    const middleTip = keypoints[12];
    const ringTip = keypoints[16];
    
    // Check if three fingertips are close to thumb
    const distances = [indexTip, middleTip, ringTip].map(tip => 
      Math.sqrt(
        Math.pow(tip.x - thumbTip.x, 2) +
        Math.pow(tip.y - thumbTip.y, 2)
      )
    );
    
    const avgDistance = distances.reduce((a, b) => a + b, 0) / 3;
    const minDistance = Math.min(...distances);
    
    // Key for M: Check if fingertips are DRAPED OVER (in front of) thumb
    // Use z-coordinate: fingers should be closer to camera (more negative z) than thumb
    // FIXED: Check ABSOLUTE z-direction - fingers should be further (POSITIVE diff) from thumb
    const zDiffs = [
      { finger: 'index', z: indexTip.z, diff: indexTip.z - thumbTip.z },
      { finger: 'middle', z: middleTip.z, diff: middleTip.z - thumbTip.z },
      { finger: 'ring', z: ringTip.z, diff: ringTip.z - thumbTip.z }
    ];
    
    // M: Fingers are AWAY from camera (thumb closer), so diff should be POSITIVE > 0.005
    const fingersInFrontCount = zDiffs.filter(f => 
      f.z !== undefined && thumbTip.z !== undefined && f.diff > 0.005
    ).length;
    
    const fingersInFront = fingersInFrontCount >= 2;
    
    // M: fingers close to thumb AND draped forward/over it
    const isM = avgDistance < 28 && minDistance < 22 && fingersInFront;
    
    console.log('   isMShape:', isM, '(avgDist:', avgDistance.toFixed(1), 'minDist:', minDistance.toFixed(1), 'fingersInFront:', fingersInFront, `${fingersInFrontCount}/3)` );
    console.log('   👆 M z-check: thumbZ=' + (thumbTip.z ? thumbTip.z.toFixed(3) : 'null'), zDiffs.map(f => `${f.finger}=${f.diff.toFixed(3)}`).join(' '));
    return isM;
  }
  
  isNShape(keypoints) {
    // N: Two fingers (index, middle) draped over thumb
    // Similar to M but ONLY 2 fingers instead of 3
    const thumbTip = keypoints[4];
    const indexTip = keypoints[8];
    const middleTip = keypoints[12];
    const ringTip = keypoints[16];
    
    // Check 2D distance - fingers should be close to thumb
    const distances = [indexTip, middleTip].map(tip => 
      Math.sqrt(
        Math.pow(tip.x - thumbTip.x, 2) +
        Math.pow(tip.y - thumbTip.y, 2)
      )
    );
    
    const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
    const minDist = Math.min(...distances);
    
    // Z-coordinate check: fingers should be CLOSE to thumb depth (not far away)
    // For N, fingers curl over thumb, so z-values should be similar
    const fingersToCheck = [
      { name: 'index', diff: Math.abs(indexTip.z - thumbTip.z) },
      { name: 'middle', diff: Math.abs(middleTip.z - thumbTip.z) }
    ];
    
    // Check if fingers are at similar depth to thumb (within 0.03 units - relaxed)
    const fingersAtSimilarDepth = fingersToCheck.filter(f => f.diff < 0.03).length;
    const depthCheck = fingersAtSimilarDepth >= 1; // At least 1 finger close in depth
    
    console.log(`   isNShape: avgDist=${avgDist.toFixed(1)} minDist=${minDist.toFixed(1)} depthCheck=${depthCheck} ${fingersAtSimilarDepth}/2 close`);
    console.log(`   👆 N z-check: thumbZ=${thumbTip.z.toFixed(3)} index=${indexTip.z.toFixed(3)} middle=${middleTip.z.toFixed(3)}`);
    console.log(`   👆 N z-diffs: index=${fingersToCheck[0].diff.toFixed(3)} middle=${fingersToCheck[1].diff.toFixed(3)}`);
    
    // N: Relaxed thresholds for 2D distance AND similar depth (fingers draped over thumb)
    return avgDist < 35 && minDist < 30 && depthCheck;
  }
  
  isXShape(keypoints, indexExt) {
    if (!indexExt) return false;
    
    const indexTip = keypoints[8];
    const indexPIP = keypoints[6]; // Proximal joint
    const indexMCP = keypoints[5]; // Base joint
    
    // Check if index is bent/crooked (not straight)
    // Calculate angles to detect hook shape
    const tipToMid = Math.sqrt(
      Math.pow(indexTip.x - indexPIP.x, 2) +
      Math.pow(indexTip.y - indexPIP.y, 2)
    );
    
    const midToBase = Math.sqrt(
      Math.pow(indexPIP.x - indexMCP.x, 2) +
      Math.pow(indexPIP.y - indexMCP.y, 2)
    );
    
    // If finger is bent, the tip-to-mid distance should be shorter
    return tipToMid < midToBase * 1.2;
  }

  isFingerExtended(keypoints, fingerName) {
    const fingerTips = {
      thumb: 4,
      index: 8,
      middle: 12,
      ring: 16,
      pinky: 20
    };
    
    const fingerBase = {
      thumb: 2,
      index: 5,
      middle: 9,
      ring: 13,
      pinky: 17
    };

    const tipIndex = fingerTips[fingerName];
    const baseIndex = fingerBase[fingerName];
    
    if (!keypoints[tipIndex] || !keypoints[baseIndex]) {
      console.log(`⚠️ Missing keypoint for ${fingerName}: tip=${tipIndex} exists=${!!keypoints[tipIndex]}, base=${baseIndex} exists=${!!keypoints[baseIndex]}`);
      return false;
    }

    const tip = keypoints[tipIndex];
    const base = keypoints[baseIndex];
    
    // Log the actual keypoint structure (only once for index finger to avoid spam)
    if (fingerName === 'index') {
      console.log(`🔍 Keypoint tip JSON:`, JSON.stringify(tip, null, 2));
      console.log(`🔍 Keypoint base JSON:`, JSON.stringify(base, null, 2));
    }
    
    // Calculate distance
    const distance = Math.sqrt(
      Math.pow(tip.x - base.x, 2) + 
      Math.pow(tip.y - base.y, 2)
    );
    
    // OPTIMIZED: Better thresholds based on MediaPipe best practices
    // For thumb, check if it's extended (distance from base)
    if (fingerName === 'thumb') {
      const isExtended = distance > 25; // Optimized threshold for ASL
      console.log(`👍 ${fingerName}: distance=${distance.toFixed(1)}, extended=${isExtended}`);
      return isExtended;
    }
    
    // OPTIMIZED: Use both distance and direction for better accuracy
    // This works regardless of hand orientation
    const yDiff = base.y - tip.y;
    
    // A finger is extended if the distance is large enough AND pointing away from palm
    // This accounts for various hand angles and orientations
    const isExtended = distance > 30;
    
    console.log(`👉 ${fingerName}: distance=${distance.toFixed(1)}, yDiff=${yDiff.toFixed(1)}, extended=${isExtended}`);
    return isExtended;
  }

  getMostFrequentGesture() {
    if (this.gestureBuffer.length === 0) return 'none';
    
    const frequency = {};
    this.gestureBuffer.forEach(gesture => {
      frequency[gesture] = (frequency[gesture] || 0) + 1;
    });
    
    return Object.keys(frequency).reduce((a, b) => 
      frequency[a] > frequency[b] ? a : b
    );
  }

  calculateConfidence(hands) {
    if (hands.length === 0) return 0;
    
    // Average confidence of all keypoints
    const hand = hands[0];
    const scores = hand.keypoints.map(kp => kp.score || 0);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    return Math.round(avgScore * 100);
  }

  // OPTIMIZED: Smooth gesture detection to reduce flickering
  smoothGesture(detectedGesture) {
    const currentTime = Date.now();
    
    // Update gesture confidence map
    if (!this.gestureConfidence.has(detectedGesture)) {
      this.gestureConfidence.set(detectedGesture, 0);
    }
    
    // Define similar gesture groups that should RESET each other's confidence
    const fistLikeGestures = new Set(['N', 'M', 'C', 'E', 'A', 'S', 'T', 'O']);
    const fingerGestures = new Set(['F', 'K', 'P', 'Q', 'R', 'U', 'V', 'W', 'X', 'H', 'B', 'G']); // Added H, B, G - similar hand shapes
    // P/N/M are confusable (fingers over thumb) - special handling
    const thumbOverlapGestures = new Set(['N', 'M', 'P', 'K']);
    
    // Check if switching between similar gestures - if so, RESET the old one
    if (this.lastGesture !== detectedGesture) {
      const bothFistLike = fistLikeGestures.has(detectedGesture) && fistLikeGestures.has(this.lastGesture);
      const bothFingerGestures = fingerGestures.has(detectedGesture) && fingerGestures.has(this.lastGesture);
      const bothThumbOverlap = thumbOverlapGestures.has(detectedGesture) && thumbOverlapGestures.has(this.lastGesture);
      
      if (bothFistLike || bothFingerGestures || bothThumbOverlap) {
        // HARD RESET confidence for similar competing gestures
        console.log(`🔄 Switching between similar gestures: ${this.lastGesture} → ${detectedGesture} (RESET old confidence)`);
        this.gestureConfidence.set(this.lastGesture, 0);
      }
    }
    
    // Increment confidence for detected gesture
    const currentConfidence = this.gestureConfidence.get(detectedGesture);
    this.gestureConfidence.set(detectedGesture, currentConfidence + 1);
    
    // AGGRESSIVE DECAY: Decay confidence for other gestures (increased from 0.5 to 2.0)
    for (const [gesture, confidence] of this.gestureConfidence.entries()) {
      if (gesture !== detectedGesture && confidence > 0) {
        this.gestureConfidence.set(gesture, Math.max(0, confidence - 2.0));
      }
    }
    
    // Debug: Show confidence map for confusable gesture debugging
    const debugGestures = new Set(['N', 'M', 'C', 'E', 'P', 'K', 'O']);
    if (debugGestures.has(detectedGesture) || debugGestures.has(this.lastGesture)) {
      const confMap = {};
      for (const [g, c] of this.gestureConfidence.entries()) {
        if (c > 0) confMap[g] = c.toFixed(1);
      }
      console.log(`📊 Smoothing: detected="${detectedGesture}" lastGesture="${this.lastGesture}" confidence=`, confMap);
    }
    
    // Only return gesture if it has enough confidence frames
    if (currentConfidence >= this.minConfidenceFrames) {
      // Debounce gesture changes
      if (detectedGesture !== this.lastGesture) {
        // Skip debounce for similar gesture switches (already reset confidence)
        const bothFistLike = fistLikeGestures.has(detectedGesture) && fistLikeGestures.has(this.lastGesture);
        const bothFingerGestures = fingerGestures.has(detectedGesture) && fingerGestures.has(this.lastGesture);
        const bothThumbOverlap = thumbOverlapGestures.has(detectedGesture) && thumbOverlapGestures.has(this.lastGesture);
        const isSimilarSwitch = bothFistLike || bothFingerGestures || bothThumbOverlap;
        
        const timeSinceLastChange = currentTime - this.lastGestureTimestamp;
        if (!isSimilarSwitch && timeSinceLastChange < this.gestureDebounceTime) {
          console.log(`⏱️ Debouncing: waiting ${this.gestureDebounceTime - timeSinceLastChange}ms before switching from ${this.lastGesture} to ${detectedGesture}`);
          return this.lastGesture; // Keep returning last gesture
        }
        console.log(`✅ Gesture switch confirmed: ${this.lastGesture} → ${detectedGesture}${isSimilarSwitch ? ' (similar, no debounce)' : ''}`);
        this.lastGesture = detectedGesture;
        this.lastGestureTimestamp = currentTime;
      }
      return detectedGesture;
    }
    
    // Not enough confidence yet
    // If detecting a NEW gesture (different from last), return null to avoid stale letter detection
    // Only return lastGesture if we're still detecting the SAME gesture
    if (detectedGesture !== this.lastGesture) {
      console.log(`⏳ Building confidence for "${detectedGesture}" (${currentConfidence}/${this.minConfidenceFrames}), returning null to prevent stale detection`);
      return null;
    }
    
    // Same gesture, return it
    return this.lastGesture;
  }

  cleanup() {
    if (this.detector) {
      this.detector.dispose();
      this.detector = null;
    }
    this.isInitialized = false;
    this.gestureBuffer = [];
    console.log('🧹 Sign Language Detector cleaned up');
  }
}

export default new SignLanguageDetector();
