'use client';

import React, { useRef, useState, useEffect, useCallback, useImperativeHandle } from 'react';
import { Download, Video, VideoOff, AlertCircle } from 'lucide-react';

interface VideoRecorderProps {
  isRecording: boolean;
  isInterviewActive: boolean;
  onRecordingStateChange?: (isRecording: boolean) => void;
  onRecordingDataChange?: (data: {
    downloadUrl: string | null;
    duration: number;
    isAvailable: boolean;
  }) => void;
  shouldStopRecording?: boolean;
}

interface VideoRecorderState {
  mediaRecorder: MediaRecorder | null;
  recordedChunks: Blob[];
  isRecording: boolean;
  recordingStartTime: number | null;
  recordingDuration: number;
  downloadUrl: string | null;
  stream: MediaStream | null;
}

class VideoRecorderManager {
  private state: VideoRecorderState = {
    mediaRecorder: null,
    recordedChunks: [],
    isRecording: false,
    recordingStartTime: null,
    recordingDuration: 0,
    downloadUrl: null,
    stream: null
  };

  private durationInterval: NodeJS.Timeout | null = null;
  private onStateChange: ((state: VideoRecorderState) => void) | null = null;

  constructor(onStateChange?: (state: VideoRecorderState) => void) {
    this.onStateChange = onStateChange || null;
  }

  private updateState(newState: Partial<VideoRecorderState>) {
    console.log('🎥 VideoRecorderManager: Updating state:', newState);
    this.state = { ...this.state, ...newState };
    this.onStateChange?.(this.state);
  }

  async startRecording(videoElement: HTMLVideoElement): Promise<boolean> {
    try {
      // Get the stream from the video element
      const stream = videoElement.srcObject as MediaStream;
      if (!stream) {
        console.error('No video stream available');
        return false;
      }

      // Create a new MediaRecorder with both video and audio tracks
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      // Clear any existing recorded chunks
      this.updateState({ recordedChunks: [] });

      // Store the mediaRecorder instance in the class
      this.state.mediaRecorder = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('🎥 Data available:', event.data.size, 'bytes');
          const newChunks = [...this.state.recordedChunks, event.data];
          this.updateState({ recordedChunks: newChunks });
        }
      };

      mediaRecorder.onstop = () => {
        console.log('🎥 Recording stopped, creating blob with', this.state.recordedChunks.length, 'chunks');
        if (this.state.recordedChunks.length > 0) {
          const blob = new Blob(this.state.recordedChunks, { type: 'video/webm' });
          const downloadUrl = URL.createObjectURL(blob);
          console.log('🎥 Blob created, size:', blob.size, 'bytes, URL:', downloadUrl);
          
          this.updateState({
            downloadUrl,
            isRecording: false,
            recordingDuration: 0
          });
        } else {
          console.error('🎥 No recorded chunks available when stopping');
        }

        if (this.durationInterval) {
          clearInterval(this.durationInterval);
          this.durationInterval = null;
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      
      this.updateState({
        isRecording: true,
        recordingStartTime: Date.now(),
        stream
      });

      // Start duration timer
      this.durationInterval = setInterval(() => {
        if (this.state.recordingStartTime) {
          const duration = Math.floor((Date.now() - this.state.recordingStartTime) / 1000);
          this.updateState({ recordingDuration: duration });
        }
      }, 1000);

      return true;
    } catch (error) {
      console.error('Failed to start video recording:', error);
      return false;
    }
  }

  stopRecording(): void {
    console.log('🎥 stopRecording called, mediaRecorder:', !!this.state.mediaRecorder, 'isRecording:', this.state.isRecording);
    if (this.state.mediaRecorder && this.state.isRecording) {
      console.log('🎥 Stopping media recorder...');
      this.state.mediaRecorder.stop();
      
      // Force create download URL if onstop doesn't work
      setTimeout(() => {
        if (!this.state.downloadUrl && this.state.recordedChunks.length > 0) {
          console.log('🎥 Fallback: Creating download URL manually');
          const blob = new Blob(this.state.recordedChunks, { type: 'video/webm' });
          const downloadUrl = URL.createObjectURL(blob);
          this.updateState({
            downloadUrl,
            isRecording: false
          });
        }
      }, 100);
    } else {
      console.log('🎥 Cannot stop recording - mediaRecorder:', !!this.state.mediaRecorder, 'isRecording:', this.state.isRecording);
    }
  }

  getRecordingState(): VideoRecorderState {
    return { ...this.state };
  }

  downloadRecording(): void {
    if (this.state.downloadUrl) {
      const a = document.createElement('a');
      a.href = this.state.downloadUrl;
      a.download = `interview-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  forceCreateDownloadUrl(): string | null {
    if (this.state.recordedChunks.length > 0 && !this.state.downloadUrl) {
      console.log('🎥 Force creating download URL with', this.state.recordedChunks.length, 'chunks');
      const blob = new Blob(this.state.recordedChunks, { type: 'video/webm' });
      const downloadUrl = URL.createObjectURL(blob);
      
      this.updateState({
        downloadUrl,
        isRecording: false
      });
      
      return downloadUrl;
    }
    return this.state.downloadUrl;
  }

  getRecordedChunks(): Blob[] {
    return this.state.recordedChunks;
  }

  cleanup(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }

    if (this.state.downloadUrl) {
      URL.revokeObjectURL(this.state.downloadUrl);
    }

    if (this.state.mediaRecorder) {
      if (this.state.isRecording) {
        this.state.mediaRecorder.stop();
      }
    }

    this.updateState({
      mediaRecorder: null,
      recordedChunks: [],
      isRecording: false,
      recordingStartTime: null,
      recordingDuration: 0,
      downloadUrl: null,
      stream: null
    });
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

const VideoRecorder = React.forwardRef<{ forceCreateDownloadUrl: () => string | null }, VideoRecorderProps>(({ 
  isRecording: interviewRecording, 
  isInterviewActive,
  onRecordingStateChange,
  onRecordingDataChange,
  shouldStopRecording = false
}, ref) => {
  const [recorderState, setRecorderState] = useState<VideoRecorderState>({
    mediaRecorder: null,
    recordedChunks: [],
    isRecording: false,
    recordingStartTime: null,
    recordingDuration: 0,
    downloadUrl: null,
    stream: null
  });

  const videoRecorderRef = useRef<VideoRecorderManager | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // Initialize video recorder manager
  useEffect(() => {
    videoRecorderRef.current = new VideoRecorderManager(setRecorderState);
    
    return () => {
      videoRecorderRef.current?.cleanup();
    };
  }, []);

  // Notify parent component of recording data changes
  useEffect(() => {
    if (onRecordingDataChange) {
      const data = {
        downloadUrl: recorderState.downloadUrl,
        duration: recorderState.recordingDuration,
        isAvailable: !!(recorderState.downloadUrl || recorderState.isRecording)
      };
      console.log('🎥 VideoRecorder: Notifying parent of data change:', data);
      onRecordingDataChange(data);
    }
  }, [recorderState.downloadUrl, recorderState.recordingDuration, recorderState.isRecording, onRecordingDataChange]);

  // Handle interview recording state changes
  useEffect(() => {
    if (!videoRecorderRef.current || !videoElementRef.current) return;

    if (interviewRecording && !recorderState.isRecording && isInterviewActive) {
      // Start video recording when interview recording starts
      videoRecorderRef.current.startRecording(videoElementRef.current);
    }
    // Remove the auto-stop logic - let recording continue until interview ends
  }, [interviewRecording, isInterviewActive, recorderState.isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      videoRecorderRef.current?.cleanup();
    };
  }, []);

  const handleDownload = () => {
    videoRecorderRef.current?.downloadRecording();
  };

  // Force create download URL - call this when interview ends
  const forceCreateDownloadUrl = () => {
    if (videoRecorderRef.current) {
      console.log('🎥 VideoRecorder: Force creating download URL');
      const downloadUrl = videoRecorderRef.current.forceCreateDownloadUrl();
      console.log('🎥 VideoRecorder: Force result:', downloadUrl);
      
      if (downloadUrl && onRecordingDataChange) {
        onRecordingDataChange({
          downloadUrl,
          duration: recorderState.recordingDuration,
          isAvailable: true
        });
      }
      return downloadUrl;
    }
    return null;
  };

  // Expose methods to parent via ref
  React.useImperativeHandle(ref, () => ({
    forceCreateDownloadUrl,
    getRecordedChunks: () => {
      if (videoRecorderRef.current) {
        return videoRecorderRef.current.getRecordedChunks();
      }
      return [];
    }
  }));

  const handleManualStart = async () => {
    if (!videoRecorderRef.current || !videoElementRef.current) return;
    
    const success = await videoRecorderRef.current.startRecording(videoElementRef.current);
    if (success && onRecordingStateChange) {
      onRecordingStateChange(true);
    }
  };

  const handleManualStop = () => {
    if (!videoRecorderRef.current) return;
    
    videoRecorderRef.current.stopRecording();
    if (onRecordingStateChange) {
      onRecordingStateChange(false);
    }
  };

  // Find video element in the DOM
  useEffect(() => {
    const findVideoElement = () => {
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      if (videoElement && videoElement.srcObject) {
        videoElementRef.current = videoElement;
        console.log('🎥 Video element found and ready for recording');
      }
    };

    // Try to find video element immediately
    findVideoElement();

    // If not found, wait a bit and try again
    const timer = setTimeout(findVideoElement, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Auto-start recording when interview becomes active
  useEffect(() => {
    if (isInterviewActive && !recorderState.isRecording && videoElementRef.current && videoRecorderRef.current) {
      console.log('🎥 Auto-starting video recording for interview');
      videoRecorderRef.current.startRecording(videoElementRef.current);
    }
  }, [isInterviewActive, recorderState.isRecording]);

  // Stop recording when interview ends and report is shown
  useEffect(() => {
    if (shouldStopRecording && recorderState.isRecording && videoRecorderRef.current) {
      console.log('🎥 Interview report shown, stopping video recording');
      videoRecorderRef.current.stopRecording();
      
      // Force create download URL after a delay if it doesn't exist
      setTimeout(() => {
        if (!recorderState.downloadUrl && recorderState.recordedChunks.length > 0) {
          console.log('🎥 Force creating download URL after stop');
          const blob = new Blob(recorderState.recordedChunks, { type: 'video/webm' });
          const downloadUrl = URL.createObjectURL(blob);
          console.log('🎥 Force created download URL:', downloadUrl);
          
          // Update state and notify parent
          setRecorderState(prev => ({
            ...prev,
            downloadUrl,
            isRecording: false
          }));
          
          if (onRecordingDataChange) {
            onRecordingDataChange({
              downloadUrl,
              duration: recorderState.recordingDuration,
              isAvailable: true
            });
          }
        }
      }, 500);
    }
  }, [shouldStopRecording, recorderState.isRecording, recorderState.recordedChunks, recorderState.downloadUrl, onRecordingDataChange]);

  // Ensure recording data is passed when interview ends
  useEffect(() => {
    if (shouldStopRecording && recorderState.downloadUrl && onRecordingDataChange) {
      console.log('🎥 Interview ended, ensuring recording data is passed to report');
      // Force update the recording data to ensure it's available in the report
      onRecordingDataChange({
        downloadUrl: recorderState.downloadUrl,
        duration: recorderState.recordingDuration,
        isAvailable: true
      });
    }
  }, [shouldStopRecording, recorderState.downloadUrl, recorderState.recordingDuration, onRecordingDataChange]);

  // Always show the recorder when interview is active
  if (!isInterviewActive && !recorderState.downloadUrl && !recorderState.isRecording) {
    return null; // Don't render anything if interview is not active
  }

  // Force create download URL if interview ended and we have chunks but no URL
  useEffect(() => {
    if (shouldStopRecording && recorderState.recordedChunks.length > 0 && !recorderState.downloadUrl) {
      console.log('🎥 Emergency: Creating download URL from chunks');
      
      // Use the manager's force method
      if (videoRecorderRef.current) {
        const downloadUrl = videoRecorderRef.current.forceCreateDownloadUrl();
        if (downloadUrl && onRecordingDataChange) {
          onRecordingDataChange({
            downloadUrl,
            duration: recorderState.recordingDuration,
            isAvailable: true
          });
        }
      }
    }
  }, [shouldStopRecording, recorderState.recordedChunks, recorderState.downloadUrl, recorderState.recordingDuration, onRecordingDataChange]);

  // CRITICAL FIX: Force create download URL when interview ends
  useEffect(() => {
    if (shouldStopRecording && !recorderState.downloadUrl) {
      console.log('🎥 CRITICAL: Interview ended without download URL, forcing creation');
      
      // Wait a bit for any pending operations to complete
      setTimeout(() => {
        if (videoRecorderRef.current) {
          console.log('🎥 CRITICAL: Calling forceCreateDownloadUrl');
          const downloadUrl = videoRecorderRef.current.forceCreateDownloadUrl();
          console.log('🎥 CRITICAL: Force result:', downloadUrl);
          
          if (downloadUrl && onRecordingDataChange) {
            console.log('🎥 CRITICAL: Notifying parent with download URL');
            onRecordingDataChange({
              downloadUrl,
              duration: recorderState.recordingDuration,
              isAvailable: true
            });
          }
        }
      }, 1000); // Wait 1 second for everything to settle
    }
  }, [shouldStopRecording, recorderState.downloadUrl, recorderState.recordingDuration, onRecordingDataChange]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 min-w-[280px]">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-600" />
            :
          </h4>
          {recorderState.isRecording && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-red-600 font-medium">Recording</span>
            </div>
          )}
        </div>

        {recorderState.isRecording && (
          <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-700">
                Duration: {videoRecorderRef.current?.formatDuration(recorderState.recordingDuration)}
              </span>
              <span className="text-xs text-red-600 font-medium">
                Auto-recording
              </span>
            </div>
          </div>
        )}

        {recorderState.downloadUrl && !recorderState.isRecording && (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <VideoOff className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Recording Complete</span>
              </div>
              <p className="text-xs text-green-600">
                Duration: {videoRecorderRef.current?.formatDuration(recorderState.recordingDuration)}
              </p>
            </div>
            
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Recording
            </button>
          </div>
        )}

        {!recorderState.isRecording && !recorderState.downloadUrl && isInterviewActive && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-600">Preparing to record...</span>
            </div>
            <div className="text-xs text-blue-500">
              Video recording will start automatically
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default VideoRecorder;
