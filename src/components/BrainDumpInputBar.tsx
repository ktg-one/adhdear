/**
 * Braindump Input Bar (|---|)
 * Textbox and voice recording / speech-to-text dictation
 * positioned at the base of the Braindump widget.
 */

import React, { useState, useRef } from 'react';
import { UserCognitiveProfile, TriageItem } from '../types/synapse';
import { TriageEngine } from '../services/triageEngine';
import { triggerKineticBlast } from './KineticCanvasOverlay';
import { Mic, MicOff, Send, Sparkles } from 'lucide-react';

interface Props {
  profile: UserCognitiveProfile;
  onItemTriaged: (item: TriageItem) => void;
  onTranscriptionChange: (text: string, isRecording: boolean) => void;
}

export const BrainDumpInputBar: React.FC<Props> = ({
  profile,
  onItemTriaged,
  onTranscriptionChange,
}) => {
  const [inputVal, setInputVal] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  const handleToggleVoice = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      onTranscriptionChange('', false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your thought.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        onTranscriptionChange('', true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setInputVal(transcript);
        onTranscriptionChange(transcript, true);
      };

      recognition.onerror = () => {
        setIsListening(false);
        onTranscriptionChange('', false);
      };

      recognition.onend = () => {
        setIsListening(false);
        onTranscriptionChange('', false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      onTranscriptionChange('', false);
    }
  };

  const handleSubmit = async (textToSubmit?: string) => {
    const raw = (textToSubmit || inputVal).trim();
    if (!raw) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      onTranscriptionChange('', false);
    }

    setIsAnalyzing(true);

    try {
      const result = await TriageEngine.triageInput(raw, profile);
      const item = TriageEngine.createTriageItem(raw, result);

      onItemTriaged(item);
      setInputVal('');
      onTranscriptionChange('', false);

      let message = 'OFFLOADED!';
      let color = '#00f2fe';

      if (result.quadrant === 'ACTIVE_PIPELINE') {
        message = 'ALIGNED ➔ ACTIVE PIPELINE (+50 XP)';
        color = '#10b981';
      } else if (result.quadrant === 'INCUBATOR_SCOUT') {
        message = 'TANGENT ➔ SCOUT INCUBATOR (ZERO LOSS!)';
        color = '#9d4edd';
      } else if (result.quadrant === 'MICRO_BUFFER') {
        message = 'BUFFERED ➔ MICRO-ACTION';
        color = '#38bdf8';
      } else {
        message = 'PARKED IN ORBIT (NO GUILT)';
        color = '#94a3b8';
      }

      triggerKineticBlast({ message, color });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-[#07090e] border border-[#1e293b] rounded-xl p-2.5 space-y-2 font-mono text-xs">
      
      {/* Input Row */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Speak or type raw brain dump..."
          className="w-full bg-[#0c101a] border border-[#1e293b] focus:border-[#00f2fe] rounded-lg pl-3 pr-16 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition font-mono"
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          <button
            onClick={handleToggleVoice}
            className={`p-1.5 rounded-md text-xs transition ${
              isListening
                ? 'bg-rose-950 text-rose-400 border border-rose-600 animate-pulse'
                : 'text-slate-500 hover:text-slate-200 hover:bg-[#141b2d]'
            }`}
            title={isListening ? 'Stop speech recording' : 'Dictate voice memo'}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => handleSubmit()}
            disabled={isAnalyzing || !inputVal.trim()}
            className="bg-[#00f2fe] hover:bg-cyan-400 disabled:opacity-40 text-black font-bold p-1.5 rounded-md transition shadow-sm flex items-center justify-center cursor-pointer active:scale-95"
            title="Dump & Scout"
          >
            {isAnalyzing ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Quick Test Prompts */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-[9px] text-slate-500 no-scrollbar">
        <span className="shrink-0 text-slate-600">Quick Test:</span>
        <button
          onClick={() => handleSubmit('Rebuild vector index with SQLite vss instead of LanceDB')}
          className="px-2 py-0.5 rounded bg-[#0c101a] border border-[#1e293b] hover:text-[#00f2fe] hover:border-[#00f2fe]/40 transition shrink-0 truncate max-w-[140px]"
        >
          Tangent: SQLite vss
        </button>
        <button
          onClick={() => handleSubmit('Fix button hover glitch in audio controller')}
          className="px-2 py-0.5 rounded bg-[#0c101a] border border-[#1e293b] hover:text-emerald-400 hover:border-emerald-500/40 transition shrink-0 truncate max-w-[140px]"
        >
          Aligned: Fix glitch
        </button>
      </div>

    </div>
  );
};
