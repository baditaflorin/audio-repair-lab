# 0018 - Live Microphone Recording Capability

## Status

Accepted

## Context

Users currently have to import an existing audio file or use the demo clip to test the audio repair features. To improve the user experience and allow for quick testing and real-time capture, the application needs a way to record audio directly from the microphone.

## Decision

Implement a live microphone recording feature using the `MediaRecorder` API. 
1. Add a "Record" button to the main interface.
2. Use `navigator.mediaDevices.getUserMedia` to request microphone access.
3. Capture audio into a `Blob`.
4. Decode the captured `Blob` using `decodeAudioFile` logic (reused or adapted) to convert it into `AudioData` for the existing pipeline.
5. Provide visual feedback during recording.

## Consequences

- Users can now test the repair tools with their own voice instantly.
- The app requires microphone permissions, which must be handled gracefully.
- Recorded audio stays in memory (local-only), adhering to the privacy-first principle (ADR 0001).

## Alternatives Considered

- Using a third-party library for recording: Rejected to keep dependencies minimal (ADR 0017).
- Real-time streaming processing: Rejected for v1 to maintain the existing worker-based batch processing model. Streaming may be a future extension.
