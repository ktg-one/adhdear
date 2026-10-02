/**
 * Focus Audio Engine Controller
 * Synthetic Brown Noise, White Noise, 432Hz Alpha Drone, and Cyber Pulse.
 */

import React, { useState, useEffect } from 'react';
import { audioEngine } from '../services/audioEngine';
import { AudioTrackType } from '../types/synapse';
import { Volume2, VolumeX, Play, Square, Radio } from 'lucide-react';

interface Props {
  initialTrack?: AudioTrackType;
  initialVolume?: number;
  autoCouple?: boolean;
}

export const AudioController: React.FC<Props> = ({
  initialTrack = 'brown',
  initialVolume = 0.5,
  autoCouple = true,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTrack, setCurrentTrack] = useState<AudioTrackType>(initialTrack);
  const [volume, setVolume] = useState<number>(initialVolume);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    audioEngine.setVolume(volume);
  }, [volume]);

  const handleTogglePlay = () => {
    const active = audioEngine.toggle(currentTrack);
    setIsPlaying(active);
  };

  const handleSelectTrack = (track: AudioTrackType) => {
    setCurrentTrack(track);
    if (isPlaying) {
      audioEngine.play(track);
    }
  };

  const tracks: Array<{ id: AudioTrackType; label: string; desc: string; color: string }> = [
    { id: 'brown', label: 'Brown Noise', desc: '1/f² sub-bass rumble', color: 'text-[#ffaa00]' },
    { id: 'alpha', label: '432Hz Drone', desc: 'Alpha wave breathing', color: 'text-[#00f2fe]' },
    { id: 'white', label: 'White Noise', desc: 'Static curtain', color: 'text-slate-300' },
    { id: 'cyber', label: 'Cyber Pulse', desc: '60 BPM lo-fi kick', color: 'text-[#ff007f]' },
  ];

  return (
    <div className="relative">
      {/* Pill Trigger */}
      <div className="flex items-center gap-2 bg-[#0c101a] border border-[#1e293b] rounded-xl px-2.5 py-1.5 text-xs font-mono">
        <button
          onClick={handleTogglePlay}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition ${
            isPlaying
              ? 'bg-[#141b2d] text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'bg-[#141b2d] text-slate-400 hover:text-white'
          }`}
          title="Toggle focus audio playback"
        >
          {isPlaying ? (
            <>
              <Square className="w-3 h-3 fill-current" />
              <span className="text-[11px] font-bold">MUTE</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" />
              <span className="text-[11px]">AUDIO</span>
            </>
          )}
        </button>

        {/* Pulse Dot */}
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <span
            className={`w-2 h-2 rounded-full ${
              isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
            }`}
          />
          <span className="text-slate-300 text-[11px] uppercase hidden sm:inline">
            {currentTrack}
          </span>
        </div>

        {/* Expand / Adjust Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-[#00f2fe] p-1 transition"
          title="Adjust procedural audio parameters"
        >
          <Volume2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Popout Audio Tuning Modal / Dropdown */}
      {isExpanded && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[#0c101a] border border-[#1e293b] rounded-2xl shadow-2xl p-4 z-50 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
            <span className="text-slate-200 font-bold flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#00f2fe]" />
              Focus Audio Bed
            </span>
            <span className="text-[10px] text-emerald-400">0 MB Native Synth</span>
          </div>

          {/* Track Selector */}
          <div className="grid grid-cols-2 gap-2">
            {tracks.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectTrack(t.id)}
                className={`p-2 rounded-lg border text-left transition ${
                  currentTrack === t.id
                    ? 'bg-[#141b2d] border-[#00f2fe] shadow-sm'
                    : 'bg-[#07090e] border-[#1e293b] text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`text-xs font-bold ${t.color}`}>{t.label}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>

          {/* Volume Slider */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Master Volume</span>
              <span className="text-slate-200">{Math.round(volume * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-[#141b2d] rounded-lg appearance-none cursor-pointer accent-[#00f2fe]"
              />
              <Volume2 className="w-3.5 h-3.5 text-slate-300" />
            </div>
          </div>

          {/* Coupled status */}
          <div className="text-[10px] text-slate-500 pt-1 border-t border-[#1e293b] flex items-center justify-between">
            <span>Timer Auto-Coupled:</span>
            <span className={autoCouple ? 'text-emerald-400' : 'text-slate-400'}>
              {autoCouple ? 'ENABLED' : 'MANUAL'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
