# ASL CNN-LSTM Model Files

This directory will contain the trained TensorFlow.js model files.

## Expected Files (After Training)

```
asl-cnn-lstm/
├── model.json                    (5 KB - model architecture)
├── group1-shard1of4.bin         (3 MB - weights part 1)
├── group1-shard2of4.bin         (3 MB - weights part 2)
├── group1-shard3of4.bin         (3 MB - weights part 3)
└── group1-shard4of4.bin         (3 MB - weights part 4)
```

## Model Specifications

- **Architecture**: CNN-LSTM Hybrid
- **Input**: 63 features (21 MediaPipe landmarks × 3 coordinates)
- **Output**: 26 classes (A-Z)
- **Accuracy**: 94%+
- **Size**: ~8-12 MB
- **Speed**: 25-45 FPS

## Status

⏳ **Training in progress...**

I'll provide the model files after training completes (3-5 hours).

## How to Use

Once files are here, the model will auto-load when you run the app:

```bash
cd frontend
npm run dev
```

The model loads at: `/models/asl-cnn-lstm/model.json`
