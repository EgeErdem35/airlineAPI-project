import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Plane, Send, User, Bot, Loader2, Calendar, CheckSquare, Search, Ticket, ChevronRight, Check } from 'lucide-react';

const AGENT_API_URL = "http://localhost:5001/api/chat/message";

function App() {
  const [messages, setMessages] = useState([
    { 
      role: 'bot', 
      content: 'Hello! How can I assist you today?',
      type: 'welcome' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const triggerAction = (actionText) => {
    setInput(actionText);
    setTimeout(() => {
       document.getElementById('send-btn')?.click();
    }, 100);
  };

  const handleSend = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input, type: 'text' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const chatHistory = messages.filter(m => m.type !== 'welcome').map(m => ({ 
        role: m.role === 'bot' ? 'assistant' : 'user', 
        content: m.content 
      }));
      chatHistory.push({ role: 'user', content: userMessage.content });

      const response = await axios.post(AGENT_API_URL, { messages: chatHistory });
      
      const botMessage = {
        role: 'bot',
        content: response.data.content,
        actionType: response.data.actionType || 'text',
        actionData: response.data.actionData || null
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Hata Detayı:", error);
      const errorMsg = error.response?.data?.error || error.message || "Bilinmeyen hata";
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: `Hatayla karşılaşıldı: ${errorMsg}`, 
        type: 'text' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // UI Components matching the assignment screenshot
  const renderWelcomeChips = () => (
    <div className="mt-4 flex flex-col gap-2">
      <button onClick={() => triggerAction("I want to find a flight from Istanbul to Frankfurt on May 10, 2026.")} className="flex items-center gap-3 bg-[#EEF2FC] text-[#3B66D9] p-3 rounded-xl hover:bg-blue-100 transition shadow-sm w-full font-medium text-sm">
        <Search size={16} /> Query Flight
      </button>
      <button onClick={() => triggerAction("I would like to book flight TK1523 to Frankfurt.")} className="flex items-center gap-3 bg-white border border-gray-100 p-3 rounded-xl hover:bg-gray-50 transition shadow-sm w-full text-gray-700 font-medium text-sm">
        <Plane size={16} className="text-blue-500" /> Book Flight
      </button>
      <button onClick={() => triggerAction("I want to check in passenger John Doe for flight TK1523 on May 10, 2026.")} className="flex items-center gap-3 bg-white border border-gray-100 p-3 rounded-xl hover:bg-gray-50 transition shadow-sm w-full text-gray-700 font-medium text-sm">
        <CheckSquare size={16} className="text-blue-500" /> Check In
      </button>
    </div>
  );

  const renderFlightCards = (flights) => {
    if (typeof flights === 'string') {
      return <p className="text-sm text-red-500 mt-2 bg-red-50 p-3 rounded-lg border border-red-200 shadow-sm">{flights}</p>;
    }
    if (!Array.isArray(flights) || flights.length === 0) return <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200">Aradığınız kriterlere uygun uçuş bulunamadı.</p>;
    
    return (
      <div className="flex flex-col gap-3 mt-3">
        {flights.map((f, i) => (
          <div key={i} className="bg-white border text-center p-0 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 flex items-center justify-between">
              <div className="flex flex-col text-left">
                <span className="font-bold text-gray-800">{f.flightNumber}</span>
                <span className="text-xs text-gray-400">
                  {f.duration ? `${Math.floor(f.duration / 60)}h ${f.duration % 60}m` : "2h 45m"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-600">{f.airportFrom}</span>
                <div className="w-8 h-[2px] bg-gray-200"></div>
                <span className="font-medium text-gray-600">{f.airportTo}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="font-bold text-gray-800">
                   {new Date(f.departureDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   {" - "}
                   {new Date(f.arrivalDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
                <span className="text-xs text-gray-400">{f.airportFrom} &nbsp; {f.airportTo}</span>
              </div>
            </div>
            {/* Action Bar inside card matching mockup */}
            <div className="border-t bg-[#F8FAFC] px-4 py-3 text-left">
              <p className="text-xs font-semibold text-gray-700 mb-2">Seats Available</p>
              <button onClick={() => triggerAction(`I would like to book flight ${f.flightNumber} on ${f.departureDateTime.split('T')[0]} for passenger Ege Erdem.`)} className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:text-blue-800">
                + Book Flight
              </button>
            </div>
          </div>
        ))}
        {/* Mockup bottom trailing action */}
        <div className="flex justify-between items-center bg-[#EEF2FC] rounded-full p-2 pl-4 mt-4 cursor-pointer hover:bg-blue-100" onClick={() => triggerAction("New Query flight")}>
            <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
                <User size={14}/> Query Flight
            </div>
            <div className="bg-blue-500 text-white p-1 rounded-full"><ChevronRight size={16}/></div>
        </div>
      </div>
    );
  };

  const renderBookingTicket = (ticket) => (
    <div className="mt-4 bg-[#F8FAFC] border border-gray-100 p-5 rounded-2xl shadow-sm text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-10 -mt-10 blur-xl"></div>
        <p className="text-sm text-gray-500 mb-4 font-medium">Flight: <span className="text-gray-800 font-bold">{ticket.flightNumber}</span></p>
        <div className="flex items-center gap-4 mb-4">
            <span className="font-bold text-gray-700">IST</span>
            <div className="flex-1 border-t border-dashed border-gray-300 relative">
               <Plane size={14} className="absolute -top-[7px] left-1/2 -translate-x-1/2 text-blue-500" />
            </div>
            <span className="font-bold text-gray-700">FRA</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-100 text-sm mb-4">
            Ticket Number: <span className="font-bold text-blue-600">{ticket.ticketNumber || "N/A"}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700 font-medium">
            <User size={16} className="text-blue-500"/> {ticket.passengerNames ? ticket.passengerNames[0] : 'Passenger'}
        </div>
        
        {/* Call to action for Checkin */}
        <div className="flex justify-between items-center bg-[#EEF2FC] rounded-full p-2 pl-4 mt-6 cursor-pointer hover:bg-blue-100" onClick={() => triggerAction(`I want to check in passenger ${ticket.passengerNames[0]} for flight ${ticket.flightNumber} on ${ticket.date}`)}>
            <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
                <Ticket size={14}/> View Boarding Pass (Check-in)
            </div>
            <div className="bg-blue-500 text-white p-1 rounded-full"><ChevronRight size={16}/></div>
        </div>
    </div>
  );

  const renderCheckInTicket = (info) => (
    <div className="mt-4 bg-blue-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full -mr-10 -mt-10 blur-2xl opacity-50"></div>
        <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
               <p className="text-blue-200 text-xs uppercase tracking-wider mb-1">Boarding Pass</p>
               <h3 className="font-bold text-xl">{info.passengerName}</h3>
            </div>
            <div className="bg-white text-blue-600 p-2 rounded-lg font-bold">
               {info.seatNumber}
            </div>
        </div>
        
        <div className="flex justify-between items-center text-center relative z-10">
           <div>
               <p className="text-3xl font-bold">IST</p>
           </div>
           <div className="flex-1 flex flex-col items-center px-4">
               <Plane size={24} className="text-blue-300 opacity-80" />
           </div>
           <div>
               <p className="text-3xl font-bold">FRA</p>
           </div>
        </div>
        <div className="mt-6 border-t border-blue-400 pt-4 flex justify-between text-xs text-blue-100">
            <span>Flight: {info.flightNumber}</span>
            <span>Date: {info.date}</span>
        </div>
    </div>
  );

  return (
    <div className="flex justify-center items-center h-screen bg-[#F3F4F6] font-sans overflow-hidden sm:p-6">
        {/* Desktop Browser / App Window Mockup */}
        <div className="w-full max-w-5xl h-full bg-white sm:rounded-2xl shadow-xl flex flex-col relative overflow-hidden border border-gray-200">
          
          {/* Header */}
          <div className="bg-white px-8 pt-6 pb-4 flex justify-between items-center border-b shadow-sm relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 text-blue-600 rounded-xl">
                 <Plane size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">GS Flight AI</h1>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Intelligent Agent Workflow</p>
              </div>
            </div>
            {/* Desktop Gateway Indicator */}
            <div className="hidden sm:flex text-xs font-mono font-bold bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full border border-gray-200">
              Gateway: 5001 &nbsp; | &nbsp; Node: 3001
            </div>
          </div>

          {/* Chat Container */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-[#FAFAFA] md:px-24">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                
                {msg.role === 'bot' && (
                  <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center mr-3 flex-shrink-0">
                    <User size={18} className="text-blue-600" />
                  </div>
                )}

                <div className={`max-w-[70%] ${msg.role === 'user' ? 'bg-[#5B7DFC] text-white rounded-2xl rounded-tr-sm shadow-md' : ''}`}>
                  
                  {msg.role === 'user' ? (
                     <div className="px-5 py-4 text-sm md:text-[15px] leading-relaxed">{msg.content}</div>
                  ) : (
                     <div className="w-full">
                        {/* Bot text is seamlessly placed in the white background according to mockup */}
                        <div className="text-gray-800 font-medium text-[15px] md:text-[16px] leading-relaxed tracking-tight pr-4">
                           {msg.content}
                        </div>
                        
                        {/* Render Contextual Data */}
                        {msg.type === 'welcome' && renderWelcomeChips()}
                        {msg.actionType === 'query_flight' && renderFlightCards(msg.actionData)}
                        {msg.actionType === 'book_flight' && renderBookingTicket(msg.actionData)}
                        {msg.actionType === 'check_in' && renderCheckInTicket(msg.actionData)}
                     </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start items-center gap-2 text-blue-500 pl-1">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-xs font-bold uppercase tracking-wider">Agent is routing MCP tools...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input */}
          <div className="p-4 md:p-6 bg-white border-t border-gray-100">
            <div className="flex justify-start items-center mb-3">
                <button onClick={() => triggerAction("Hello Assistant!")} className="text-blue-600 flex items-center gap-2 font-bold text-sm bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full transition-colors">
                   + What else can I assist you with? <div className="bg-blue-600 text-white rounded-full p-0.5"><ChevronRight size={14}/></div>
                </button>
            </div>
            <form onSubmit={handleSend} className="flex gap-2 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything... (e.g. Yarın İstanbul'a uçuş bul...)"
                className="flex-1 bg-gray-50 border border-gray-300 rounded-full px-6 py-4 focus:outline-none focus:border-blue-500 text-[15px] transition-colors shadow-sm"
                disabled={loading}
              />
              <button 
                id="send-btn"
                type="submit"
                disabled={loading || !input.trim()} 
                className="bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-lg absolute right-1 top-0 bottom-0 my-auto"
              >
                <Send size={18} className="-ml-1" />
              </button>
            </form>
          </div>
        </div>
    </div>
  );
}

export default App;