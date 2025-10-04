'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Play, Pause, Square, X, CheckCircle } from 'lucide-react'

interface VoiceRecorderProps {
  onTranscription: (transcript: string) => void
  onClose: () => void
}

export default function VoiceRecorder({ onTranscription, onClose }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcript, setTranscript] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }

  const playRecording = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      
      audio.onended = () => setIsPlaying(false)
      audio.play()
      setIsPlaying(true)
    }
  }

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const transcribeAudio = async () => {
    if (!audioBlob) return

    setIsTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.wav')

      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Transcription failed')
      }

      const data = await response.json()
      setTranscript(data.transcript)
    } catch (error) {
      console.error('Transcription error:', error)
      setTranscript('Transcription failed. Please try again.')
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleUseTranscript = () => {
    if (transcript.trim()) {
      onTranscription(transcript)
      onClose()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Voice Recording</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Recording Controls */}
      <div className="text-center">
        {!audioBlob ? (
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <Mic className="w-8 h-8 text-red-600" />
            </div>
            
            {!isRecording ? (
              <div className="space-y-3">
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mx-auto"
                >
                  <Mic className="w-5 h-5" />
                  Start Recording
                </button>
                <p className="text-sm text-gray-600">
                  Click to start recording your case details
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-2xl font-mono text-red-600">
                  {formatTime(recordingTime)}
                </div>
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors mx-auto"
                >
                  <Square className="w-5 h-5" />
                  Stop Recording
                </button>
                <p className="text-sm text-gray-600">
                  Recording in progress...
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <div className="space-y-3">
              <div className="text-lg font-medium text-gray-900">
                Recording Complete
              </div>
              <div className="text-sm text-gray-600">
                Duration: {formatTime(recordingTime)}
              </div>
              
              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-3">
                {!isPlaying ? (
                  <button
                    onClick={playRecording}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Play
                  </button>
                ) : (
                  <button
                    onClick={pauseRecording}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                )}
                
                <button
                  onClick={transcribeAudio}
                  disabled={isTranscribing}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {isTranscribing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Transcribing...
                    </>
                  ) : (
                    <>
                      <MicOff className="w-4 h-4" />
                      Transcribe
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Transcription:</h4>
          <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
            <p className="text-sm text-gray-700">{transcript}</p>
          </div>
          <div className="flex items-center justify-end gap-3 mt-3">
            <button
              onClick={() => setTranscript('')}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleUseTranscript}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Use This Text
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        {audioBlob && !transcript && (
          <button
            onClick={transcribeAudio}
            disabled={isTranscribing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isTranscribing ? 'Transcribing...' : 'Transcribe & Use'}
          </button>
        )}
      </div>
    </div>
  )
}
