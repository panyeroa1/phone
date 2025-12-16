import React, { useState, useRef } from 'react';
import { Phone, Delete, User } from 'lucide-react';

interface KeypadProps {
  onCallNumber: (number: string) => void;
}

const Keypad: React.FC<KeypadProps> = ({ onCallNumber }) => {
  const [dialedNumber, setDialedNumber] = useState('');
  
  // Refs for long press logic
  const timerRef = useRef<number | null>(null);
  const isLongPressRef = useRef(false);

  const handleNumberClick = (num: string) => {
    if (dialedNumber.length < 15) {
      setDialedNumber(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setDialedNumber(prev => prev.slice(0, -1));
  };

  const handleTouchStart = (num: string) => {
    if (num !== '0') return;
    isLongPressRef.current = false;
    timerRef.current = window.setTimeout(() => {
      isLongPressRef.current = true;
      handleNumberClick('+');
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500); 
  };

  const handleTouchEnd = (num: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
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
    if (num.startsWith('+')) {
        return num.replace(/(\+\d{1})(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4');
    }
    return num.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  const KeypadButton = ({ num, sub }: { num: string, sub?: string }) => (
    <button 
      onMouseDown={num === '0' ? () => handleTouchStart('0') : undefined}
      onMouseUp={num === '0' ? () => handleTouchEnd('0') : undefined}
      onMouseLeave={num === '0' ? () => handleTouchEnd('nothing') : undefined}
      onTouchStart={num === '0' ? () => handleTouchStart('0') : undefined}
      onTouchEnd={num === '0' ? (e) => { e.preventDefault(); handleTouchEnd('0'); } : undefined}
      onClick={num !== '0' ? () => handleNumberClick(num) : undefined}
      className="w-[78px] h-[78px] rounded-full flex flex-col items-center justify-center transition-all duration-200 active:bg-zinc-600 bg-zinc-800"
    >
      <span className="text-[36px] font-normal text-white leading-none mb-[-4px]">{num}</span>
      {sub && <span className="text-[10px] font-bold text-white tracking-[1px]">{sub}</span>}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Display Area */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 pt-6">
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
      <div className="px-8 pb-10">
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
          <KeypadButton num="*" />
          <KeypadButton num="0" sub="+" />
          <KeypadButton num="#" />
        </div>

        {/* Bottom Call Controls Row */}
        <div className="flex justify-center items-center mt-6 relative">
             {/* Spacer to balance the grid layout visually */}
             <div className="w-[78px]" />

             {/* Center: Call Button */}
             <button
               onClick={() => onCallNumber(dialedNumber)}
               className="w-[78px] h-[78px] bg-[#34C759] text-white rounded-full flex items-center justify-center transition-all hover:bg-[#32b350] active:bg-[#2da348] mx-[24px]"
             >
               <Phone size={36} fill="currentColor" />
             </button>

             {/* Right: Delete Button (Conditional) */}
             <div className="w-[78px] flex justify-center">
                {dialedNumber && (
                  <button onClick={handleDelete} className="text-zinc-500 active:text-white transition-colors p-4">
                    <Delete size={30} strokeWidth={2} />
                  </button>
                )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default Keypad;
