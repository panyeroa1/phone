import React from 'react';
import { Mic, Video, Users, User, Phone } from 'lucide-react';

interface ActiveCallProps {
  name: string;
  number: string;
  status: string;
  duration?: string;
  onHangup: () => void;
  volume: number;
}

const ActiveCall: React.FC<ActiveCallProps> = ({ name, number, status, onHangup, volume }) => {
  // Calculate pulse effect based on volume
  const pulseScale = 1 + Math.min(volume * 0.5, 0.5); // Max 1.5x scale
  const pulseOpacity = 0.3 + Math.min(volume, 0.7);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-zinc-800 via-zinc-900 to-black sm:rounded-[40px] overflow-hidden relative">
      
      {/* Top Info */}
      <div className="pt-20 pb-8 px-6 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-zinc-400 mb-4">
              <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                  <User size={20} className="text-zinc-300" />
              </div>
              <span className="text-xl font-medium text-white">{name}</span>
          </div>
          
          {/* Visualizer / Avatar */}
          <div className="relative mb-8 mt-4">
              <div 
                className="absolute inset-0 bg-white/30 rounded-full blur-2xl transition-all duration-75 ease-out"
                style={{ 
                  transform: `scale(${pulseScale * 1.5})`,
                  opacity: pulseOpacity
                }}
              />
              <div className="w-28 h-28 rounded-full bg-zinc-700 flex items-center justify-center relative z-10 border border-white/10">
                   <span className="text-4xl text-white font-light">{name.charAt(0)}</span>
              </div>
          </div>

          <div className="space-y-1">
              <h2 className="text-3xl font-medium text-white">{name}</h2>
              <p className="text-lg text-zinc-400">{number}</p>
              <p className="text-sm text-zinc-500 mt-2">{status}</p>
          </div>
      </div>

      {/* Controls */}
      <div className="mt-auto bg-zinc-900/80 backdrop-blur-xl rounded-t-[3rem] pb-12 pt-10 px-8">
         <div className="grid grid-cols-3 gap-x-6 gap-y-6 place-items-center mb-10">
            {/* Row 1 */}
            <div className="flex flex-col items-center gap-2">
                <button className="w-16 h-16 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors">
                    <Mic size={28} />
                </button>
                <span className="text-xs text-white">mute</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <button className="w-16 h-16 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors">
                    <div className="grid grid-cols-3 gap-1 p-3">
                        {[...Array(9)].map((_,i) => <div key={i} className="w-1 h-1 bg-current rounded-full"/>)}
                    </div>
                </button>
                <span className="text-xs text-white">keypad</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <button className={`w-16 h-16 rounded-full text-white flex items-center justify-center transition-colors bg-white text-black`}>
                    <div className="relative">
                      <User size={28} />
                    </div>
                </button>
                <span className="text-xs text-white">audio</span>
            </div>

             {/* Row 2 */}
            <div className="flex flex-col items-center gap-2">
                <button className="w-16 h-16 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors">
                    <span className="text-2xl font-light">+</span>
                </button>
                <span className="text-xs text-white">add call</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <button className="w-16 h-16 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors">
                    <Video size={28} />
                </button>
                <span className="text-xs text-white">FaceTime</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <button className="w-16 h-16 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors">
                    <Users size={28} />
                </button>
                <span className="text-xs text-white">contacts</span>
            </div>
         </div>

         {/* End Call */}
         <div className="flex justify-center">
            <button
              onClick={onHangup}
              className="w-[72px] h-[72px] bg-[#EB4E3D] text-white rounded-full flex items-center justify-center transition-all active:scale-95"
            >
              <Phone size={32} className="rotate-[135deg]" fill="currentColor" />
            </button>
         </div>
      </div>
    </div>
  );
};

export default ActiveCall;
