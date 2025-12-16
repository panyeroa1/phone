import React, { useState } from 'react';
import { Plus, Search, User } from 'lucide-react';
import AgentWizard from './AgentWizard';
import { AgentConfig } from '../utils/promptGenerator';

export interface Contact {
  id: string;
  name: string;
  number: string;
  role: string;
  voice: string;
  systemPrompt: string;
}

interface ContactsProps {
  contacts: Contact[];
  onAddContact: (contact: Contact) => void;
  onCallContact: (contact: Contact) => void;
}

const Contacts: React.FC<ContactsProps> = ({ contacts, onAddContact, onCallContact }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCreateAgent = (systemPrompt: string, config: any) => {
    // Generate a pseudo number
    const randomNum = `555-01${Math.floor(Math.random() * 90) + 10}`;
    
    const newContact: Contact = {
      id: Date.now().toString(),
      name: config.agentName,
      number: randomNum,
      role: config.context,
      voice: config.voiceName,
      systemPrompt: systemPrompt
    };
    
    onAddContact(newContact);
    setIsAdding(false);
  };

  if (isAdding) {
    return <AgentWizard onSave={handleCreateAgent} onCancel={() => setIsAdding(false)} />;
  }

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <button className="text-blue-500 text-[17px]">Groups</button>
        <button onClick={() => setIsAdding(true)} className="text-blue-500">
          <Plus size={24} />
        </button>
      </div>
      
      <div className="px-4 pb-2">
         <h1 className="text-[34px] font-bold">Contacts</h1>
         <div className="relative mt-2">
            <Search className="absolute left-2 top-2 text-zinc-500" size={16} />
            <input 
              type="text" 
              placeholder="Search" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg py-1.5 pl-8 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none"
            />
         </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            No contacts found. Tap + to create an AI Agent.
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredContacts.map((contact) => (
              <div 
                key={contact.id}
                onClick={() => onCallContact(contact)}
                className="flex items-center gap-4 p-4 border-b border-zinc-800 active:bg-zinc-900 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">
                  {contact.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">{contact.name}</div>
                  <div className="text-xs text-zinc-400">{contact.role}</div>
                </div>
                <div className="text-zinc-500 text-sm">{contact.voice}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Contacts;
