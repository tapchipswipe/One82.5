
import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, Bot, Loader2 } from 'lucide-react';
import { connectLiveAssistant, decodeBase64, encodeBase64 } from '../services/geminiService';

interface LiveAssistantProps {
  onClose: () => void;
}

const LiveAssistant: React.FC<LiveAssistantProps> = ({ onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [transcription, setTranscription] = useState("");
  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

  useEffect(() => {
    startSession();
    return () => stopSession();
  }, []);

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const startSession = async () => {
    setIsConnecting(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
    outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });

    const sessionPromise = connectLiveAssistant({
      onopen: () => {
        setIsConnecting(false);
        setIsActive(true);
        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
        scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const int16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
          sessionPromise.then(s => s.sendRealtimeInput({ media: { data: encodeBase64(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }));
        };
        source.connect(scriptProcessorRef.current);
        scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
      },
      onmessage: async (message: any) => {
        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (audioData) {
          const ctx = outputAudioContextRef.current!;
          nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
          const buffer = await decodeAudioData(decodeBase64(audioData), ctx);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(nextStartTimeRef.current);
          nextStartTimeRef.current += buffer.duration;
          sourcesRef.current.add(source);
          source.onended = () => sourcesRef.current.delete(source);
        }
        if (message.serverContent?.interrupted) {
          sourcesRef.current.forEach(s => s.stop());
          sourcesRef.current.clear();
          nextStartTimeRef.current = 0;
        }
      },
      onerror: (e: any) => console.error(e),
      onclose: () => setIsActive(false),
    });

    sessionRef.current = sessionPromise;
  };

  const stopSession = () => {
    sessionRef.current?.then((s: any) => s.close());
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    setIsActive(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                Gemini Live Voice
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-indigo-600 shadow-xl shadow-indigo-500/50' : 'bg-slate-200'}`}>
                {isConnecting ? <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /> : isActive ? <Volume2 className="w-10 h-10 text-white animate-pulse" /> : <MicOff className="w-10 h-10 text-slate-400" />}
                {isActive && <div className="absolute inset-0 rounded-full border-4 border-indigo-400 animate-ping opacity-20"></div>}
            </div>
            
            <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                    {isConnecting ? 'Connecting...' : isActive ? 'Listening & Speaking' : 'Assistant Idle'}
                </h4>
                <p className="text-sm text-slate-500 mt-2">
                    {isActive ? 'Talk naturally to explore your business data.' : 'Connection closed.'}
                </p>
            </div>
            
            <div className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[4rem] text-sm text-slate-600 dark:text-slate-300 italic">
                {transcription || "Assistant audio is currently playing..."}
            </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-center">
            <button onClick={onClose} className="px-6 py-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-lg font-bold">
                Finish Conversation
            </button>
        </div>
      </div>
    </div>
  );
};

export default LiveAssistant;
