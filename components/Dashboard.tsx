import React, { useState, useRef } from 'react';
import { Settings, Play, Mic, Briefcase, User, Database, Check, Loader2, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import { generateSystemPrompt } from '../utils/promptGenerator';

export interface DashboardConfig {
  agentName: string;
  companyName: string;
  context: string;
  voiceName: string;
  dataToCollect: string[];
}

interface DashboardProps {
  onUpdateConfig: (systemPrompt: string, config: DashboardConfig) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const VOICES = [
  { name: 'Aoede', gender: 'Female', desc: 'Confident, Expert' },
  { name: 'Kore', gender: 'Female', desc: 'Calm, Soothing' },
  { name: 'Fenrir', gender: 'Male', desc: 'Deep, Authoritative' },
  { name: 'Charon', gender: 'Male', desc: 'Low, Serious' },
  { name: 'Puck', gender: 'Male', desc: 'Playful, Energetic' },
  { name: 'Zephyr', gender: 'Female', desc: 'Warm, Friendly' },
];

const DATA_OPTIONS = [
  'Full Name',
  'Email Address',
  'Phone Number',
  'Budget / Pricing',
  'Appointment Time',
  'Order Number',
  'Feedback / Rating'
];

const Dashboard: React.FC<DashboardProps> = ({ onUpdateConfig, isOpen, onToggle }) => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<DashboardConfig>({
    agentName: 'Stephen Lernout',
    companyName: 'Eburon Properties',
    context: 'Senior Real Estate Broker. Warm, imperfect, charming.',
    voiceName: 'Aoede',
    dataToCollect: ['Appointment Time', 'Budget / Pricing']
  });

  const toggleDataOption = (option: string) => {
    setConfig(prev => ({
      ...prev,
      dataToCollect: prev.dataToCollect.includes(option)
        ? prev.dataToCollect.filter(o => o !== option)
        : [...prev.dataToCollect, option]
    }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // 1. Generate the Prompt using Gemini Flash Lite
      const systemPrompt = await generateSystemPrompt({
        agentName: config.agentName,
        companyName: config.companyName,
        context: config.context,
        dataToCollect: config.dataToCollect
      });
      
      // 2. Pass up to App
      onUpdateConfig(systemPrompt, config);
    } catch (e) {
      console.error(e);
      alert("Failed to generate agent configuration.");
    } finally {
      setLoading(false);
    }
  };

  const playVoiceSample = (voice: string) => {
    // Mock functionality for demo purposes as we don't have real URLs
    // In a real app, this would play an MP3 from Vapi or Google TTS
    const synth = window.speechSynthesis;
    if (synth) {
       // Try to find a matching system voice or just speak
       const utterance = new SpeechSynthesisUtterance(`Hello, I am ${voice}. This is a sample of my voice.`);
       synth.speak(utterance);
    }
  };

  return (
    <div className={`fixed inset-y-0 left-0 bg-gray-900 border-r border-gray-800 shadow-2xl z-50 transition-all duration-300 transform ${isOpen ? 'translate-x-0 w-80' : '-translate-x-full w-80'}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white tracking-wide">Agent Config</h2>
        <button onClick={onToggle} className="text-gray-400 hover:text-white">
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="p-6 space-y-8 overflow-y-auto h-[calc(100vh-80px)]">
        
        {/* Identity Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium uppercase tracking-wider">
            <Briefcase size={14} /> <span>Identity</span>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Company Name</label>
              <input 
                type="text" 
                value={config.companyName}
                onChange={(e) => setConfig({...config, companyName: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Agent Name</label>
              <input 
                type="text" 
                value={config.agentName}
                onChange={(e) => setConfig({...config, agentName: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="e.g. Sarah"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Context / Role</label>
              <textarea 
                value={config.context}
                onChange={(e) => setConfig({...config, context: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors h-20 resize-none"
                placeholder="Describe the role..."
              />
            </div>
          </div>
        </div>

        {/* Voice Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium uppercase tracking-wider">
            <Volume2 size={14} /> <span>Voice</span>
          </div>
          
          <div className="space-y-2">
            {VOICES.map((voice) => (
              <div 
                key={voice.name}
                onClick={() => setConfig({...config, voiceName: voice.name})}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-all ${config.voiceName === voice.name ? 'bg-indigo-900/20 border-indigo-500' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${config.voiceName === voice.name ? 'bg-indigo-400' : 'bg-gray-600'}`} />
                  <div>
                    <div className="text-sm font-medium text-white">{voice.name}</div>
                    <div className="text-xs text-gray-500">{voice.gender} • {voice.desc}</div>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); playVoiceSample(voice.name); }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                >
                  <Play size={14} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Data Collection Section (Whitelist) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium uppercase tracking-wider">
            <Database size={14} /> <span>Data Collection</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {DATA_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => toggleDataOption(opt)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${config.dataToCollect.includes(opt) ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'}`}
              >
                {config.dataToCollect.includes(opt) && <Check size={10} />}
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Generating Agent...</span>
            </>
          ) : (
            <>
              <Settings size={18} />
              <span>Update Agent</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};

export default Dashboard;