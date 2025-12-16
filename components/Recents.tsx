import React from 'react';
import { Info, PhoneOutgoing, PhoneIncoming, PhoneMissed } from 'lucide-react';

export interface CallLog {
  id: string;
  agentName: string;
  date: string; // ISO string
  duration: string; // e.g. "5 mins"
  status: 'outgoing' | 'incoming' | 'missed';
  label: string;
}

interface RecentsProps {
  logs: CallLog[];
}

const Recents: React.FC<RecentsProps> = ({ logs }) => {
  return (
    <div className="flex flex-col h-full bg-black text-white">
       {/* Header */}
       <div className="px-4 py-3 flex items-center justify-between">
         <button className="text-blue-500 text-[17px]">Edit</button>
         <div className="bg-zinc-800 rounded-lg p-0.5 flex">
            <button className="px-3 py-1 bg-black rounded-[6px] text-[13px] font-medium shadow">All</button>
            <button className="px-3 py-1 text-[13px] font-medium text-zinc-400">Missed</button>
         </div>
       </div>

       <div className="px-4 pb-2">
         <h1 className="text-[34px] font-bold">Recents</h1>
       </div>

       <div className="flex-1 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 mt-10">
              No recent calls.
            </div>
          ) : (
            <div className="flex flex-col pl-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center py-3 border-b border-zinc-800 pr-4">
                   <div className="mr-3 text-zinc-400">
                     {log.status === 'outgoing' && <PhoneOutgoing size={14} />}
                     {log.status === 'incoming' && <PhoneIncoming size={14} />}
                     {log.status === 'missed' && <PhoneMissed size={14} className="text-red-500" />}
                   </div>
                   <div className="flex-1">
                      <div className={`font-semibold ${log.status === 'missed' ? 'text-red-500' : 'text-white'}`}>
                        {log.agentName}
                      </div>
                      <div className="text-[13px] text-zinc-500">
                        {log.label}  {new Date(log.date).toLocaleDateString()}
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <span className="text-zinc-500 text-sm">{log.duration}</span>
                      <Info size={22} className="text-blue-500" />
                   </div>
                </div>
              ))}
            </div>
          )}
       </div>
    </div>
  );
};

export default Recents;
