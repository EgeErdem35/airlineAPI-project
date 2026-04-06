import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Plane, Send, User, Bot, Loader2, Calendar, MapPin } from 'lucide-react';

// Senin Gateway portun 5001 olarak güncellendiği için burayı ona göre ayarladık
const GATEWAY_URL = "http://localhost:5001/api/v1/flights";

function App() {
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Merhaba! Ben Galatasaray Flight AI Asistanı. Uçuş sorgulamak için bana tarih ve şehir belirtebilirsin. (Örn: 1 Nisan ADB-IST)', type: 'text' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Kullanıcı mesajını ekrana ekle
    const userMessage = { role: 'user', content: input, type: 'text' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Backend sorgusu (Şu an 1 Nisan ADB-IST verilerini getirecek şekilde ayarlandı)
      // İleride buraya Mistral'den gelen JSON parametrelerini bağlayacağız
      const response = await axios.get(`${GATEWAY_URL}/query`, {
        params: {
          airportFrom: "ADB",
          airportTo: "IST",
          dateFrom: "2026-04-01",
          dateTo: "2026-04-01",
          numberOfPeople: 1,
          tripType: "ONE_WAY"
        }
      });

      const botMessage = {
        role: 'bot',
        content: response.data.length > 0 
          ? `Sorgun için ${response.data.length} uygun uçuş buldum:` 
          : 'Maalesef aradığın kriterlerde uçuş bulunamadı.',
        flights: response.data,
        type: 'flight_list'
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("API Hatası:", error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: 'Üzgünüm, şu an uçuş verilerine ulaşamıyorum. Lütfen Backend ve Gateway servislerinin çalıştığından emin ol.', 
        type: 'text' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      {/* Header - Galatasaray Temalı Mavi/Sarı Dokunuşlar */}
      <header className="bg-blue-700 text-white p-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-full text-blue-700">
            <Plane size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">GS Flight AI</h1>
            <p className="text-xs text-blue-200">Akıllı Uçuş Asistanı</p>
          </div>
        </div>
        <div className="text-xs font-mono bg-blue-800 px-3 py-1 rounded-full border border-blue-600">
          Gateway: 5001
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] sm:max-w-[70%] group`}>
              <div className={`flex items-center gap-2 mb-1 text-[10px] font-bold uppercase tracking-wider ${
                msg.role === 'user' ? 'flex-row-reverse text-blue-600' : 'text-gray-500'
              }`}>
                {msg.role === 'user' ? <User size={12}/> : <Bot size={12}/>}
                {msg.role === 'user' ? 'Siz' : 'Asistan'}
              </div>
              
              <div className={`p-4 rounded-2xl shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                
                {/* Uçuş Kartları */}
                {msg.flights && msg.flights.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {msg.flights.map((f, i) => (
                      <div key={i} className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col gap-3 hover:border-blue-300 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2 bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                            <Ticket size={12}/> {f.flightNumber}
                          </div>
                          <span className="text-blue-700 font-bold text-sm">₺1.250,00</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-gray-700">
                          <div className="text-center">
                            <div className="text-lg font-bold">{f.airportFrom}</div>
                            <div className="text-[10px] text-gray-400">Kalkış</div>
                          </div>
                          <div className="flex-1 flex flex-col items-center px-4">
                            <div className="w-full h-[1px] bg-blue-200 relative">
                              <Plane size={14} className="absolute -top-[7px] left-1/2 -translate-x-1/2 text-blue-300" />
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1">{f.duration} dk</span>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">{f.airportTo}</div>
                            <div className="text-[10px] text-gray-400">Varış</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-gray-500 border-t border-blue-100 pt-2">
                          <Calendar size={12}/> {new Date(f.departureDateTime).toLocaleString('tr-TR')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 size={16} className="animate-spin text-blue-500" />
              Veritabanı sorgulanıyor...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nereye uçmak istersin? (Örn: İzmir'den İstanbul'a)"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
          />
          <button 
            type="submit"
            disabled={loading || !input.trim()} 
            className="absolute right-2 top-1.5 bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors shadow-sm"
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-[10px] text-center text-gray-400 mt-2">
          Bu asistan Mistral LLM ve MCP sunucusu ile güçlendirilmiştir.
        </p>
      </div>
    </div>
  );
}

export default App;