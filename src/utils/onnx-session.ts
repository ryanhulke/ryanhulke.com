import ort from 'onnxruntime-web';

// Configure ONNX Runtime for web
ort.env.wasm.wasmPaths = '/';

let session: ort.InferenceSession | null = null;

export async function getOrCreateSession(modelPath: string) {
  if (!session) {
    // Try to create session with specific options
    try {
      session = await ort.InferenceSession.create(modelPath, {
        executionProviders: ['wasm'],
      });
    } catch (error) {
      console.error('Failed to create ONNX session:', error);
      throw error;
    }
  }
  return session;
}
