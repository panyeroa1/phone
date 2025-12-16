import React, { useState, useRef } from 'react';
import { Phone, Mic, Video, Users, User, Delete, Info, Signal, Wifi, Battery } from 'lucide-react';

interface DialerProps {
  onCall: () => void;
  onHangup: () => void;
  state: 'disconnected' | 'ringing' | 'connecting' | 'connected';
  volume: number; // 0 to 1
  error: string | null;
}

const Dialer: React.FC<DialerProps> = ({ onCall, onHangup, state, volume, error }) => {
  const [dialedNumber, setDialedNumber] = useState('');
  
  const isConnected = state === 'connected';
  const isConnecting = state === 'connecting';
  const isRinging = state === 'ringing';
  const isActive = isConnected || isConnecting || isRinging;

  // Refs for long press logic
  const timerRef = useRef<number | null>(null);
  const isLongPressRef = useRef(false);

  // Calculate pulse effect based on volume
  const pulseScale = 1 + Math.min(volume * 0.5, 0.5); // Max 1.5x scale
  const pulseOpacity = 0.3 + Math.min(volume, 0.7);

  const handleNumberClick = (num: string) => {
    if (dialedNumber.length < 15) {
      setDialedNumber(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setDialedNumber(prev => prev.slice(0, -1));
  };

  // --- Long Press Logic for '0' ---
  const handleTouchStart = (num: string) => {
    if (num !== '0') return;
    isLongPressRef.current = false;
    timerRef.current = window.setTimeout(() => {
      isLongPressRef.current = true;
      handleNumberClick('+');
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500); // 500ms threshold
  };

  const handleTouchEnd = (num: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // If it wasn't a long press, register as a normal click
    // Only applies to '0' which has special handling. Others handled by onClick.
    if (num === '0') {
      if (!isLongPressRef.current) {
        handleNumberClick('0');
      }
    } else {
        handleNumberClick(num);
    }
  };

  const formatPhoneNumber = (num: string) => {
    if (!num) return '';
    // iOS formatting style
    if (num.startsWith('+')) {
        return num.replace(/(\+\d{1})(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4');
    }
    return num.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  const KeypadButton = ({ num, sub }: { num: string, sub?: string }) => (
    <button 
      // Mouse/Touch handlers for 0/+ logic
      onMouseDown={num === '0' ? () => handleTouchStart('0') : undefined}
      onMouseUp={num === '0' ? () => handleTouchEnd('0') : undefined}
      onMouseLeave={num === '0' ? () => handleTouchEnd('nothing') : undefined} // Cancel if drag away
      onTouchStart={num === '0' ? () => handleTouchStart('0') : undefined}
      onTouchEnd={num === '0' ? (e) => { e.preventDefault(); handleTouchEnd('0'); } : undefined}
      
      // Standard click for others
      onClick={num !== '0' ? () => handleNumberClick(num) : undefined}
      
      className={`w-[78px] h-[78px] rounded-full flex flex-col items-center justify-center transition-all duration-200 active:bg-zinc-600 ${isActive ? 'bg-zinc-800' : 'bg-zinc-800'}`}
    >
      <span className="text-[36px] font-normal text-white leading-none mb-[-4px]">{num}</span>
      {sub && <span className="text-[10px] font-bold text-white tracking-[1px]">{sub}</span>}
    </button>
  );

  return (
    <div className="flex flex-col h-full w-full mx-auto bg-black sm:rounded-[40px] sm:h-[844px] sm:w-[390px] overflow-hidden relative font-sans text-white shadow-2xl border-[8px] border-black box-content">
      
      {/* iOS Status Bar Placeholder */}
      <div className="flex justify-between items-center px-6 pt-3 pb-2 text-white text-[15px] font-semibold z-10">
        <span>9:41</span>
        <div className="flex items-center gap-1.5">
          <Signal size={16} className="fill-current" />
          <Wifi size={16} />
          <Battery size={20} className="fill-current" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-10">
        
        {!isActive ? (
          // --- KEYPAD VIEW (iOS Style) ---
          <div className="flex flex-col h-full">
            
            {/* Display Area */}
            <div className="flex-1 flex flex-col justify-center items-center px-8 pt-12">
               <div className="text-[40px] font-light tracking-tight text-white h-16 transition-all break-all text-center leading-none">
                 {formatPhoneNumber(dialedNumber) || ""}
               </div>
               {dialedNumber && (
                 <button className="text-blue-500 text-[13px] font-medium mt-2">
                   Add Number
                 </button>
               )}
            </div>

            {/* Keypad Grid */}
            <div className="px-8 pb-12">
              <div className="grid grid-cols-3 gap-x-[24px] gap-y-[18px] place-items-center">
                <KeypadButton num="1" sub="" />
                <KeypadButton num="2" sub="ABC" />
                <KeypadButton num="3" sub="DEF" />
                <KeypadButton num="4" sub="GHI" />
                <KeypadButton num="5" sub="JKL" />
                <KeypadButton num="6" sub="MNO" />
                <KeypadButton num="7" sub="PQRS" />
                <KeypadButton num="8" sub="TUV" />
                <KeypadButton num="9" sub="WXYZ" />
                <div className="w-[78px] h-[78px]" /> {/* Spacer */}
                <KeypadButton num="0" sub="+" />
                
                {/* Delete Button (Only visible if number exists) */}
                <div className="w-[78px] h-[78px] flex items-center justify-center">
                  {dialedNumber && (
                    <button 
                      onClick={handleDelete}
                      className="text-zinc-500 active:text-white transition-colors p-4"
                    >
                      <Delete size={30} strokeWidth={2} />
                    </button>
                  )}
                </div>
              </div>

              {/* Call Button */}
              <div className="flex justify-center mt-6">
                <button
                  onClick={onCall}
                  className="w-[78px] h-[78px] bg-[#34C759] text-white rounded-full flex items-center justify-center transition-all hover:bg-[#32b350] active:bg-[#2da348]"
                >
                  <Phone size={36} fill="currentColor" />
                </button>
              </div>
            </div>

            {/* Bottom Tabs (Fake) */}
            <div className="bg-zinc-900/90 backdrop-blur-md pt-3 pb-6 px-6 flex justify-between items-center text-zinc-500 text-[10px] font-medium border-t border-zinc-800">
                <div className="flex flex-col items-center gap-1"><div className="w-6 h-6 rounded-full bg-zinc-800"/>Favorites</div>
                <div className="flex flex-col items-center gap-1"><div className="w-6 h-6 rounded-full bg-zinc-800"/>Recents</div>
                <div className="flex flex-col items-center gap-1 text-blue-500"><div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center"><User size={14} fill="currentColor"/></div>Contacts</div>
                <div className="flex flex-col items-center gap-1 text-blue-500"><div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">#</div>Keypad</div>
                <div className="flex flex-col items-center gap-1"><div className="w-6 h-6 rounded-full bg-zinc-800"/>Voicemail</div>
            </div>
          </div>

        ) : (
          // --- ACTIVE CALL VIEW (iOS Style) ---
          <div className="flex flex-col h-full bg-gradient-to-b from-zinc-800 via-zinc-900 to-black">
            
            {/* Top Info */}
            <div className="pt-16 pb-8 px-6 flex flex-col items-center text-center">
                <div className="flex items-center gap-2 text-zinc-400 mb-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                        <User size={20} className="text-zinc-300" />
                    </div>
                    <span className="text-xl font-medium text-white">Stephen Lernout</span>
                </div>
                
                {/* Visualizer / Avatar */}
                <div className="relative mb-8 mt-4">
                     {isConnected && (
                      <div 
                        className="absolute inset-0 bg-white/30 rounded-full blur-2xl transition-all duration-75 ease-out"
                        style={{ 
                          transform: `scale(${pulseScale * 1.5})`,
                          opacity: pulseOpacity
                        }}
                      />
                    )}
                    <div className="w-28 h-28 rounded-full bg-zinc-700 flex items-center justify-center relative z-10 border border-white/10">
                         <span className="text-4xl text-white font-light">SL</span>
                    </div>
                </div>

                <div className="space-y-1">
                    <h2 className="text-3xl font-medium text-white">Stephen Lernout</h2>
                    <p className="text-lg text-zinc-400">{dialedNumber || "+1 (844) 484 9501"}</p>
                    <p className="text-sm text-zinc-500 mt-2">
                        {isConnected ? '00:14' : isRinging ? 'calling mobile...' : 'connecting...'}
                    </p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mx-8 px-4 py-3 bg-red-500/90 text-white text-xs rounded-xl text-center mb-4">
                {error}
              </div>
            )}

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
                      <button className={`w-16 h-16 rounded-full text-white flex items-center justify-center transition-colors ${isConnected ? 'bg-white text-black' : 'bg-zinc-800/80'}`}>
                          <div className="relative">
                            <span className="absolute -top-1 -right-2">
                                {/* Speaker waves */}
                            </span>
                            <User size={28} /> {/* Using User as generic speaker icon replacement */}
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
        )}
      </div>
    </div>
  );
};

export default Dialer;