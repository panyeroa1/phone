import React, { useState, useEffect } from 'react';
import { useLiveCall } from './hooks/useLiveCall';
import ActiveCall from './components/ActiveCall';
import Keypad from './components/Keypad';
import Contacts, { Contact } from './components/Contacts';
import Recents, { CallLog } from './components/Recents';
import { SYSTEM_INSTRUCTION, DEFAULT_VOICE_NAME } from './constants';
import { Phone, Clock, Users, Star, Voicemail } from 'lucide-react';

const DEFAULT_CONTACT: Contact = {
  id: 'default-1',
  name: 'Stephen Lernout',
  number: '555-0199',
  role: 'Senior Broker',
  voice: DEFAULT_VOICE_NAME,
  systemPrompt: SYSTEM_INSTRUCTION
};

const App: React.FC = () => {
  // --- Persistent State ---
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('BEATRICE_CONTACTS');
    return saved ? JSON.parse(saved) : [DEFAULT_CONTACT];
  });

  const [recents, setRecents] = useState<CallLog[]>(() => {
    const saved = localStorage.getItem('BEATRICE_RECENTS');
    return saved ? JSON.parse(saved) : [];
  });

  // --- UI State ---
  const [activeTab, setActiveTab] = useState<'favorites' | 'recents' | 'contacts' | 'keypad' | 'voicemail'>('keypad');
  const [activeCallContact, setActiveCallContact] = useState<Contact | null>(null);

  // --- Live Call Hook ---
  // We dynamically pass the current contact's config.
  // If no contact is active, we pass defaults to keep hook happy, but we won't connect.
  const { connectionState, connect, disconnect, volumeLevel, error } = useLiveCall({
    systemInstruction: activeCallContact?.systemPrompt || SYSTEM_INSTRUCTION,
    voiceName: activeCallContact?.voice || DEFAULT_VOICE_NAME
  });

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem('BEATRICE_CONTACTS', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('BEATRICE_RECENTS', JSON.stringify(recents));
  }, [recents]);

  // --- Handlers ---

  const handleAddContact = (newContact: Contact) => {
    setContacts(prev => [...prev, newContact]);
    setActiveTab('contacts');
  };

  const startCall = async (contact: Contact) => {
    setActiveCallContact(contact);
    // Add to recents
    const newLog: CallLog = {
      id: Date.now().toString(),
      agentName: contact.name,
      date: new Date().toISOString(),
      duration: '0:00', // Update later if possible
      status: 'outgoing',
      label: 'mobile'
    };
    setRecents(prev => [newLog, ...prev]);
    
    // Connect
    await connect();
  };

  const handleDialNumber = (number: string) => {
    // 1. Check if number matches a contact
    const match = contacts.find(c => c.number === number || c.number.replace(/\D/g,'') === number);
    if (match) {
      startCall(match);
    } else {
      // 2. If no match, maybe call default or show error?
      // For this demo, we'll assume any unknown number calls Stephen (or we could fail)
      // Let's create a temporary "Unknown" contact to allow dialing
      const unknownContact: Contact = {
        id: 'temp',
        name: 'Unknown Agent',
        number: number,
        role: 'General',
        voice: DEFAULT_VOICE_NAME,
        systemPrompt: SYSTEM_INSTRUCTION
      };
      startCall(unknownContact);
    }
  };

  const handleHangup = async () => {
    await disconnect();
    setActiveCallContact(null);
  };

  // --- Render ---

  // If in a call, show ActiveCall overlay
  if (connectionState !== 'disconnected') {
    return (
      <div className="flex h-screen bg-black justify-center items-center">
        <div className="w-full h-full sm:h-[844px] sm:w-[390px]">
           <ActiveCall 
             name={activeCallContact?.name || "Unknown"} 
             number={activeCallContact?.number || ""}
             status={connectionState}
             onHangup={handleHangup}
             volume={volumeLevel}
           />
        </div>
      </div>
    );
  }

  // Main Tabbed Interface
  return (
    <div className="flex h-screen bg-zinc-900 justify-center">
      <div className="w-full h-full sm:h-[844px] sm:w-[390px] bg-black flex flex-col sm:rounded-[40px] overflow-hidden border-[8px] border-black box-content relative">
        
        {/* Tab Content (No Status Bar) */}
        <div className="flex-1 overflow-hidden relative pt-6">
           {activeTab === 'recents' && <Recents logs={recents} />}
           {activeTab === 'contacts' && (
             <Contacts 
               contacts={contacts} 
               onAddContact={handleAddContact} 
               onCallContact={startCall} 
             />
           )}
           {activeTab === 'keypad' && <Keypad onCallNumber={handleDialNumber} />}
           {/* Placeholders for others */}
           {activeTab === 'favorites' && <div className="p-10 text-zinc-500 text-center flex items-center justify-center h-full">No Favorites</div>}
           {activeTab === 'voicemail' && <div className="p-10 text-zinc-500 text-center flex items-center justify-center h-full">Voicemail Empty</div>}
        </div>

        {/* Bottom Tab Bar */}
        <div className="bg-zinc-900/95 backdrop-blur-md pt-2 pb-6 px-4 flex justify-between items-center border-t border-zinc-800">
          <button onClick={() => setActiveTab('favorites')} className={`flex flex-col items-center gap-1 w-1/5 ${activeTab === 'favorites' ? 'text-blue-500' : 'text-zinc-500'}`}>
             <Star size={24} fill={activeTab === 'favorites' ? "currentColor" : "none"} />
             <span className="text-[10px] font-medium">Favorites</span>
          </button>
          
          <button onClick={() => setActiveTab('recents')} className={`flex flex-col items-center gap-1 w-1/5 ${activeTab === 'recents' ? 'text-blue-500' : 'text-zinc-500'}`}>
             <Clock size={24} />
             <span className="text-[10px] font-medium">Recents</span>
          </button>
          
          <button onClick={() => setActiveTab('contacts')} className={`flex flex-col items-center gap-1 w-1/5 ${activeTab === 'contacts' ? 'text-blue-500' : 'text-zinc-500'}`}>
             <Users size={24} fill={activeTab === 'contacts' ? "currentColor" : "none"} />
             <span className="text-[10px] font-medium">Contacts</span>
          </button>
          
          <button onClick={() => setActiveTab('keypad')} className={`flex flex-col items-center gap-1 w-1/5 ${activeTab === 'keypad' ? 'text-blue-500' : 'text-zinc-500'}`}>
             <div className="grid grid-cols-3 gap-[2px] p-0.5">
                 {[...Array(9)].map((_,i) => <div key={i} className="w-1 h-1 bg-current rounded-full"/>)}
             </div>
             <span className="text-[10px] font-medium">Keypad</span>
          </button>
          
          <button onClick={() => setActiveTab('voicemail')} className={`flex flex-col items-center gap-1 w-1/5 ${activeTab === 'voicemail' ? 'text-blue-500' : 'text-zinc-500'}`}>
             <Voicemail size={24} />
             <span className="text-[10px] font-medium">Voicemail</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default App;
