'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Video, Clock, AlertCircle } from 'lucide-react';

interface VideoDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  onReject: () => void;
  duration: number;
  downloadUrl: string | null;
}

const VideoDownloadModal: React.FC<VideoDownloadModalProps> = ({
  isOpen,
  onClose,
  onDownload,
  onReject,
  duration,
  downloadUrl
}) => {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen || !downloadUrl) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="flex min-h-screen items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Interview Recording Complete</h3>
                    <p className="text-blue-100 text-sm">Your interview has been recorded</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Recording Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Recording Duration</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{formatDuration(duration)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Your complete interview session has been recorded with both video and audio.
                </div>
              </div>

              {/* Download Options */}
              <div className="space-y-4">
                <button
                  onClick={onDownload}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  Download Recording
                </button>

                <button
                  onClick={onReject}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-300"
                >
                  <X className="w-5 h-5" />
                  Delete Recording
                </button>
              </div>

              {/* Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Recording will be deleted if not downloaded</p>
                    <p>This recording is stored temporarily and will be automatically removed when you close this page.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default VideoDownloadModal;
