import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Play, Pause, Upload, X, CheckCircle2, Loader2, FileAudio, Brain, ListTodo, Bell, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dbGetByIndex, dbPutMany, dbDelete, type VoiceNoteRecord } from '../../lib/db';
import { format } from 'date-fns';

interface Props {
  customerId: string;
  customerName: string;
}

function generateAISummary(text: string): { summary: string; actionItems: string[]; followUp: string[] } {
  // Rule-based AI summary (no API needed)
  const lower = text.toLowerCase();
  const summary = text.length > 50
    ? text.slice(0, 120) + (text.length > 120 ? '...' : '')
    : text || 'Voice note recorded.';

  const actionItems: string[] = [];
  if (lower.includes('catalog') || lower.includes('catalogue')) actionItems.push('Send product catalog');
  if (lower.includes('whatsapp') || lower.includes('message')) actionItems.push('Send WhatsApp message');
  if (lower.includes('sample') || lower.includes('piece')) actionItems.push('Send product samples');
  if (lower.includes('order') || lower.includes('purchase')) actionItems.push('Process order request');
  if (lower.includes('price') || lower.includes('rate')) actionItems.push('Share updated price list');
  if (lower.includes('return') || lower.includes('replace')) actionItems.push('Handle return/replacement');
  if (actionItems.length === 0) actionItems.push('Follow up within 3 days');

  const followUp: string[] = [];
  if (lower.includes('interest') || lower.includes('want')) followUp.push('Customer is interested — follow up within 24 hours');
  if (lower.includes('busy') || lower.includes('later') || lower.includes('tomorrow')) followUp.push('Customer requested callback — schedule for tomorrow');
  if (lower.includes('not interest') || lower.includes("don't want")) followUp.push('Customer not interested — re-engage after 2 weeks');
  if (followUp.length === 0) followUp.push('Check back in 7 days with new arrivals');

  return { summary, actionItems, followUp };
}

export function VoiceNotePanel({ customerId, customerName }: Props) {
  const [voiceNotes, setVoiceNotes] = useState<VoiceNoteRecord[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const audioUrlsRef = useRef<Record<string, string>>({});

  // Load voice notes for this customer
  useEffect(() => {
    dbGetByIndex<VoiceNoteRecord>('voiceNotes', 'by-customer', customerId).then((notes) => {
      setVoiceNotes(notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      // Create object URLs for blobs
      const urls: Record<string, string> = {};
      for (const note of notes) {
        if (note.blob) {
          urls[note.id] = URL.createObjectURL(note.blob);
        }
      }
      audioUrlsRef.current = urls;
      setAudioUrls(urls);
    });

    return () => {
      Object.values(audioUrlsRef.current).forEach(URL.revokeObjectURL);
    };
  }, [customerId]);

  const saveNote = async (blob: Blob, duration: number, transcription?: string) => {
    const id = `vn_${customerId}_${Date.now()}`;
    const ai = transcription ? generateAISummary(transcription) : null;

    const note: VoiceNoteRecord = {
      id,
      customerId,
      createdAt: new Date().toISOString(),
      duration,
      blob,
      transcription,
      aiSummary: ai?.summary,
      actionItems: ai?.actionItems,
      followUpSuggestions: ai?.followUp,
    };

    await dbPutMany('voiceNotes', [note]);
    const url = URL.createObjectURL(blob);
    setAudioUrls((prev) => ({ ...prev, [id]: url }));
    setVoiceNotes((prev) => [note, ...prev]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setIsProcessing(true);
        await saveNote(blob, recordingTime);
        setIsProcessing(false);
        setRecordingTime(0);
      };

      mr.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch {
      alert('Microphone access denied. Please allow microphone access to record voice notes.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    // Estimate duration from file size (rough: ~16KB/sec for audio)
    const estimatedDuration = Math.round(file.size / 16000);
    await saveNote(blob, estimatedDuration, undefined);
    setIsProcessing(false);
  };

  const togglePlay = (noteId: string, url: string) => {
    if (playingId === noteId) {
      audioRefs.current[noteId]?.pause();
      setPlayingId(null);
      return;
    }
    Object.values(audioRefs.current).forEach((a) => a.pause());
    setPlayingId(noteId);
    if (!audioRefs.current[noteId]) {
      const audio = new Audio(url);
      audio.onended = () => setPlayingId(null);
      audioRefs.current[noteId] = audio;
    }
    audioRefs.current[noteId].play();
  };

  const deleteNote = async (noteId: string) => {
    await dbDelete('voiceNotes', noteId);
    URL.revokeObjectURL(audioUrls[noteId]);
    setAudioUrls((prev) => { const n = { ...prev }; delete n[noteId]; return n; });
    setVoiceNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4">
        <h4 className="text-xs font-black text-brand-primary uppercase tracking-wider mb-3 flex items-center gap-2">
          <Mic className="h-3.5 w-3.5" /> Voice Notes
        </h4>

        <div className="flex items-center gap-3">
          {/* Record Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={isRecording ? stopRecording : startRecording}
            className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all ${
              isRecording
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'
                : 'bg-brand-primary hover:bg-brand-secondary shadow-brand-primary/30'
            }`}
          >
            {isRecording ? (
              <Square className="h-4 w-4 text-white" fill="white" />
            ) : (
              <Mic className="h-4 w-4 text-white" />
            )}
          </motion.button>

          {/* Waveform / Status */}
          <div className="flex-1">
            {isRecording ? (
              <div className="flex items-center gap-2">
                <div className="flex items-end gap-0.5 h-6">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: ['4px', `${8 + (((i * 7) % 16) / 16) * 16}px`, '4px'] }}
                      transition={{ duration: 0.4 + i * 0.1, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-1 bg-rose-500 rounded-full"
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-rose-600 tabular-nums">{formatDuration(recordingTime)}</span>
                <span className="text-xs text-rose-500 animate-pulse">● Recording</span>
              </div>
            ) : (
              <div className="h-1.5 w-full bg-blue-100 rounded-full" />
            )}
          </div>

          {/* Upload Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="h-10 px-3 rounded-xl border border-blue-200 bg-white/70 hover:bg-white text-blue-600 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Upload className="h-3.5 w-3.5" /> Upload
          </motion.button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ''; }}
          />
        </div>

        {isProcessing && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-primary" />
            Processing voice note...
          </div>
        )}
      </div>

      {/* Voice Note List */}
      <AnimatePresence>
        {voiceNotes.map((note) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-3"
          >
            {/* Player Row */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => audioUrls[note.id] ? togglePlay(note.id, audioUrls[note.id]) : null}
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  audioUrls[note.id] ? 'bg-brand-primary hover:bg-brand-secondary' : 'bg-slate-200'
                } transition-all`}
              >
                {playingId === note.id ? (
                  <Pause className="h-3.5 w-3.5 text-white" fill="white" />
                ) : (
                  <Play className="h-3.5 w-3.5 text-white ml-0.5" />
                )}
              </button>

              <div className="flex-1">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-primary rounded-full"
                    style={{ width: playingId === note.id ? '60%' : '0%', transition: 'width 0.5s linear' }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>{format(new Date(note.createdAt), 'dd MMM, h:mm a')}</span>
                  <span>{formatDuration(note.duration)}</span>
                </div>
              </div>

              <button onClick={() => deleteNote(note.id)} className="h-7 w-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* AI Summary */}
            {note.aiSummary && (
              <div className="bg-indigo-50 rounded-xl p-3 space-y-2">
                <p className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1">
                  <Brain className="h-3 w-3" /> AI Summary
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">{note.aiSummary}</p>
              </div>
            )}

            {/* Action Items */}
            {note.actionItems && note.actionItems.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 mb-1.5">
                  <ListTodo className="h-3 w-3" /> Action Items
                </p>
                <div className="space-y-1">
                  {note.actionItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                      <div className="h-1.5 w-1.5 rounded-full bg-brand-primary shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-Up Suggestions */}
            {note.followUpSuggestions && note.followUpSuggestions.length > 0 && (
              <div className="bg-amber-50 rounded-xl p-2.5">
                <p className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-1 mb-1">
                  <Bell className="h-3 w-3" /> Follow-Up
                </p>
                {note.followUpSuggestions.map((s, i) => (
                  <p key={i} className="text-xs text-amber-700">{s}</p>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {voiceNotes.length === 0 && !isRecording && (
        <div className="text-center py-6 text-slate-400">
          <FileAudio className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium">No voice notes yet</p>
          <p className="text-xs mt-1">Press the mic button to record</p>
        </div>
      )}
    </div>
  );
}
