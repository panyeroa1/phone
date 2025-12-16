import React, { useState } from 'react';
import { Play, Loader2, Volume2, Briefcase, Database, Check } from 'lucide-react';
import { generateSystemPrompt } from '../utils/promptGenerator';
import { DashboardConfig } from './Dashboard'; // Importing type for reuse if needed, or redefining locally

const VOICES = [
  { name: 'Aoede', gender: 'Female', desc: 'Confident, Expert' },
  { name: 'Kore', gender: 'Female', desc: 'Calm, Soothing' },
  { name: 'Fenrir', gender: 'Male', desc: 'Deep, Authoritative' },
  { name: 'Charon', gender: 'Male', desc: 'Low, Serious' },
  { name: 'Puck', gender: 'Male', desc: 'Playful, Energetic' },
  { name: 'Zephyr', gender: 'Female', desc: 'Warm, Friendly' },
];

const DATA_OPTIONS = [
  'Full Name', 'Email Address', 'Phone Number', 'Budget / Pricing', 'Appointment Time'
];

interface AgentWizardProps {
  onSave: (systemPrompt: string, config: any) => void;
  onCancel: () => void;
}

const AgentWizard: React.FC<AgentWizardProps> = ({ onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    agentName: '',
    companyName: '',
    context: '',
    voiceName: 'Aoede',
    dataToCollect: [] as string[]
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
    if(!config.agentName) return alert("Please enter a name");
    
    setLoading(true);
    try {
      const systemPrompt = await generateSystemPrompt({
        agentName: config.agentName,
        companyName: config.companyName,
        context: config.context,
        dataToCollect: config.dataToCollect
      });
      onSave(systemPrompt, config);
    } catch (e) {
      console.error(e);
      alert("Failed to create agent.");
    } finally {
      setLoading(false);
    }
  };

  const playVoiceSample = (voice: string) => {
    const synth = window.speechSynthesis;
    if (synth) {
       const utterance = new SpeechSynthesisUtterance(`Hello, I am ${voice}.`);
       synth.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-white animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
         <button onClick={onCancel} className="text-blue-500">Cancel</button>
         <h2 className="font-semibold">New Agent</h2>
         <button onClick={handleGenerate} disabled={loading} className="text-blue-500 font-bold disabled:opacity-50">
           {loading ? <Loader2 className="animate-spin" size={20} /> : 'Done'}
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
         {/* Icon Placeholder */}
         <div className="flex justify-center my-4">
            <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-4xl font-light">
               {config.agentName ? config.agentName.charAt(0) : '?'}
            </div>
            <button className="absolute mt-16 ml-16 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Edit</button>
         </div>

         <div className="space-y-4 bg-zinc-800/50 p-4 rounded-xl">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 uppercase font-bold">Identity</label>
              <input 
                placeholder="Agent Name (e.g. Sarah)"
                className="w-full bg-zinc-800 p-3 rounded-lg text-white border border-zinc-700 focus:border-blue-500 focus:outline-none"
                value={config.agentName}
                onChange={e => setConfig({...config, agentName: e.target.value})}
              />
              <input 
                placeholder="Company"
                className="w-full bg-zinc-800 p-3 rounded-lg text-white border border-zinc-700 focus:border-blue-500 focus:outline-none"
                value={config.companyName}
                onChange={e => setConfig({...config, companyName: e.target.value})}
              />
              <textarea 
                placeholder="Role / Context (e.g. Helpful support agent)"
                className="w-full bg-zinc-800 p-3 rounded-lg text-white border border-zinc-700 focus:border-blue-500 focus:outline-none h-24 resize-none"
                value={config.context}
                onChange={e => setConfig({...config, context: e.target.value})}
              />
            </div>
         </div>

         <div className="space-y-2 bg-zinc-800/50 p-4 rounded-xl">
             <label className="text-xs text-zinc-500 uppercase font-bold">Voice</label>
             <div className="grid grid-cols-2 gap-2">
                {VOICES.map(v => (
                   <div 
                      key={v.name}
                      onClick={() => setConfig({...config, voiceName: v.name})}
                      className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between ${config.voiceName === v.name ? 'bg-blue-600/20 border-blue-500' : 'bg-zinc-800 border-zinc-700'}`}
                   >
                      <div className="text-sm">{v.name}</div>
                      <button onClick={(e) => { e.stopPropagation(); playVoiceSample(v.name); }}>
                         <Play size={14} fill="currentColor" />
                      </button>
                   </div>
                ))}
             </div>
         </div>

         <div className="space-y-2 bg-zinc-800/50 p-4 rounded-xl">
             <label className="text-xs text-zinc-500 uppercase font-bold">Data to Collect</label>
             <div className="flex flex-wrap gap-2">
                 {DATA_OPTIONS.map(opt => (
                    <button
                       key={opt}
                       onClick={() => toggleDataOption(opt)}
                       className={`px-3 py-1 text-xs rounded-full border ${config.dataToCollect.includes(opt) ? 'bg-blue-600 border-blue-500' : 'bg-zinc-800 border-zinc-700'}`}
                    >
                       {opt}
                    </button>
                 ))}
             </div>
         </div>
      </div>
    </div>
  );
};

export default AgentWizard;
