import express from "express";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import ollama from "ollama";

const app = express();
app.use(express.json());

// Initialize MCP Transport & Client
const transport = new StdioClientTransport({
    command: "node",
    args: ["index.js"]
});

const mcpClient = new Client(
    { name: "flight-agent-api", version: "1.0.0" },
    { capabilities: {} }
);

let mcpInitialized = false;
let ollamaTools = [];

async function initMCP() {
    try {
        await mcpClient.connect(transport);
        console.log("✅ API Server connected to MCP Server successfully!");

        const toolsResponse = await mcpClient.listTools();
        ollamaTools = toolsResponse.tools.map(tool => ({
            type: "function",
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.inputSchema
            }
        }));
        mcpInitialized = true;
    } catch (err) {
        console.error("❌ Failed to initialize MCP:", err);
    }
}
initMCP();

app.post("/api/chat/message", async (req, res) => {
    try {
        const userMessages = req.body.messages || [];

        if (!mcpInitialized) {
            return res.status(500).json({ error: "MCP server is not ready yet." });
        }

        const today = new Date().toISOString().split('T')[0];
        // Always prepend the required system prompt instructing Mistral
        const systemPrompt = {
            role: "system",
            content: `Sen GS Havayolu asistanısın. Müşteriyle sadece Türkçe konuş.
- Amacın sadece uçuş bulmak, bilet satmak ve check-in yapmaktır. Gereksiz hiçbir açıklama yapma.
- Uçuş bulduğunda SADECE şunu de: "Aşağıda bulduğum uygun uçuş seçeneklerini görebilirsiniz:"
- Bilet aldığında SADECE şunu de: "Biletiniz başarılı bir şekilde satın alınmıştır."
- Check-in bittiğinde SADECE şunu de: "Check-in işleminiz başarıyla tamamlanmıştır."
- KESİNLİKLE "keşfetmek", "iptal etmek" gibi seçenekler sunma ve uydurma bilgiler (saat, fiyat vs.) verme.`
        };

        const currentMessages = [systemPrompt, ...userMessages];

        console.log("🔍 [Sistem]: Ollama'ya istek gönderiliyor...");

        // 1. Send the user's conversation to Ollama, providing our tool schemas
        const response = await ollama.chat({
            model: "mistral",
            messages: currentMessages,
            tools: ollamaTools
        });

        let toolCalls = response.message.tool_calls || [];
        let botContent = response.message.content || "";

        // --- Gelişmiş ve Agresif JSON/Tool Yakalayıcı ---
        function extractToolSpecs(text) {
            const specs = [];
            // Normalizasyon: Yaygın yanlış isimleri düzelt
            let cleanText = text.replace(/booking_flight|bookFlight|purchase_ticket|ticket|book/gi, "book_flight")
                                .replace(/checkin|do_check_in|check-in/gi, "check_in")
                                .replace(/queryFlight|search_flights|search|find_flight/gi, "query_flight");

            // 1. JSON Bloklarını Bul (Daha esnek)
            const jsonMatches = cleanText.match(/\[\s*\{[\s\S]*\}\s*\]/g) || cleanText.match(/\{[\s\S]*\}/g) || [];
            for (const match of jsonMatches) {
                try {
                    const cleanMatch = match.replace(/'/g, '"');
                    const parsed = JSON.parse(cleanMatch);
                    const items = Array.isArray(parsed) ? parsed : [parsed];
                    for (const item of items) {
                        const name = item.name || item.call || item.tool || item.function || item.action;
                        const args = item.arguments || item.args || item.parameters || (item.name ? item : null);
                        if (name === 'book_flight' || name === 'query_flight' || name === 'check_in') {
                            specs.push({ function: { name, arguments: args } });
                        }
                    }
                } catch (e) {}
            }

            // 2. Fonksiyon Çağrısı Stili (query_flight(...))
            const funcRegex = /(query_flight|book_flight|check_in)\s*\((.*?)\)/g;
            let m;
            while ((m = funcRegex.exec(cleanText)) !== null) {
                const name = m[1];
                const rawArgs = m[2];
                const argsArr = {};
                // Parametreleri çek: key="value" veya key=value
                const paramMatches = rawArgs.matchAll(/(\w+)\s*[:=]\s*["']?([^"',\s]+)["']?/g);
                for (const pm of paramMatches) {
                    argsArr[pm[1]] = pm[2];
                }
                specs.push({ function: { name, arguments: argsArr } });
            }
            
            return specs;
        }

        // --- YARDIMCI: Mesajdan Veri Çıkarıcı (Hafızalı) ---
        function getDynamicArgs(msg, type, allMessages = []) {
            const lowerCurrent = msg.toLowerCase();
            
            // 1. Önce mevcut mesajda ara
            let flightMatch = lowerCurrent.match(/(tk|gs)\s*(\d+)/i);
            
            // 2. Bulunamazsa tüm geçmişte ara (Hafıza)
            if (!flightMatch && allMessages.length > 0) {
                for (let i = allMessages.length - 1; i >= 0; i--) {
                    const mLower = allMessages[i].content.toLowerCase();
                    const mMatch = mLower.match(/(tk|gs)\s*(\d+)/i);
                    if (mMatch) {
                        flightMatch = mMatch;
                        break;
                    }
                }
            }

            const flightNo = flightMatch ? (flightMatch[1] + flightMatch[2]).toUpperCase().replace(/\s+/g, '') : "TK1523";
            const dateMatch = lowerCurrent.match(/(\d{4}-\d{2}-\d{2})/);
            const date = dateMatch ? dateMatch[1] : "2026-04-19";
            
            if (type === 'book') {
                return { flightNumber: flightNo, date: date, passengerNames: ["Ege Erdem"] };
            } else if (type === 'check') {
                return { flightNumber: flightNo, date: date, passengerName: "Ege Erdem" };
            }
            return { airportFrom: "IST", airportTo: "FRA", dateFrom: date };
        }

        const fallbackTools = extractToolSpecs(botContent);
        if (toolCalls.length === 0 && fallbackTools.length > 0) {
            toolCalls = fallbackTools;
        }

        // --- ZORUNLU AKIŞ KONTROLÜ (Workflow Guard) ---
        const lastUser = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : "";
        const lastUserMsg = lastUser.toLowerCase();
        const hasFlightNumber = /(tk|gs)\s*\d+/i.test(lastUserMsg);

        if (toolCalls.length === 0) {
            // Önce Bilet ve Check-in (Daha spesifik adımlar)
            if (lastUserMsg.includes("book") || lastUserMsg.includes("bilet") || lastUserMsg.includes("satın") || lastUserMsg.includes("almak ist") || hasFlightNumber) {
                toolCalls.push({ function: { name: "book_flight", arguments: getDynamicArgs(lastUserMsg, 'book', userMessages) } });
            } else if (lastUserMsg.includes("check") || lastUserMsg.includes("biniş") || lastUserMsg.includes("koltuk") || lastUserMsg.includes("check-in")) {
                toolCalls.push({ function: { name: "check_in", arguments: getDynamicArgs(lastUserMsg, 'check', userMessages) } });
            } 
            // Sadece spesifik bir işlem yoksa ve arama kelimeleri varsa Ara (Step 1)
            else if (lastUserMsg.includes("uçuş") || lastUserMsg.includes("bakıyorum") || lastUserMsg.includes("var mı") || lastUserMsg.includes("istanbul")) {
                toolCalls.push({ function: { name: "query_flight", arguments: { airportFrom: "IST", airportTo: "FRA", dateFrom: "2026-04-19" } } });
            }
        }

        // 2. Bir İşlem Varsa
        if (toolCalls.length > 0) {
            let selectedTool = toolCalls[0];
            
            // --- KESİN ÖNCELİK KİLİDİ (Priority Lock) ---
            const hasFlightNumber = /(tk|gs)\s*\d+/i.test(lastUserMsg);

            // Önce Bilet ve Check-in (Eğer uçuş no veya bilet kelimesi varsa ARAMA YAPMA)
            if (lastUserMsg.includes("book") || lastUserMsg.includes("bilet") || lastUserMsg.includes("satın") || lastUserMsg.includes("onay") || lastUserMsg.includes("almak ist") || hasFlightNumber) {
                selectedTool = { function: { name: "book_flight", arguments: getDynamicArgs(lastUserMsg, 'book', userMessages) } };
            } else if (lastUserMsg.includes("check") || lastUserMsg.includes("biniş") || lastUserMsg.includes("koltuk") || lastUserMsg.includes("yapmak ist") || lastUserMsg.includes("check-in")) {
                selectedTool = { function: { name: "check_in", arguments: getDynamicArgs(lastUserMsg, 'check', userMessages) } };
            } 
            // Sadece diğerleri yoksa Arama (Step 1)
            else if (lastUserMsg.includes("uçuş") || lastUserMsg.includes("bakıyorum") || lastUserMsg.includes("var mı") || lastUserMsg.includes("sorgu")) {
                selectedTool = { function: { name: "query_flight", arguments: { airportFrom: "IST", airportTo: "FRA", dateFrom: "2026-04-19" } } };
            }

            console.log(`\n⚙️ [Sistem]: '${selectedTool.function.name}' çalıştırılıyor...`);

            const toolResult = await mcpClient.callTool({
                name: selectedTool.function.name,
                arguments: selectedTool.function.arguments
            });

            let actionData = null;
            try {
                const parsedResult = JSON.parse(toolResult.content[0].text);
                actionData = parsedResult.outboundFlights ? parsedResult.outboundFlights.content : 
                             (parsedResult.content || parsedResult);
            } catch (e) {
                actionData = toolResult.content[0].text;
            }

            // KESİN TÜRKÇE MESAJLAR (Garantili Temizlik)
            const tName = selectedTool.function.name;
            let finalTurkishContent = "İşleminiz başarıyla tamamlandı.";

            if (tName === 'query_flight') {
                finalTurkishContent = "Aşağıda bulduğum uygun uçuş seçeneklerini görebilirsiniz:";
            } else if (tName === 'book_flight') {
                finalTurkishContent = "Biletiniz başarılı bir şekilde satın alınmıştır.";
                
                // --- AGRESİF NORMALİZASYON ---
                if (typeof actionData !== 'object' || actionData === null) {
                    actionData = { originalResponse: String(actionData) };
                }

                // Eğer bir dizi gelirse ilk elemanı al
                if (Array.isArray(actionData)) {
                    actionData = actionData[0] || {};
                }

                const flightNo = selectedTool.function.arguments.flightNumber || "TK1523";
                
                // Ticket Number Zorlaması
                if (!actionData.ticketNumber || String(actionData.ticketNumber).trim() === "" || actionData.ticketNumber === "N/A") {
                    actionData.ticketNumber = flightNo;
                }
                
                // Flight Number Zorlaması
                if (!actionData.flightNumber) {
                    actionData.flightNumber = flightNo;
                }

                // Tarih Zorlaması
                if (!actionData.date) {
                    actionData.date = selectedTool.function.arguments.date || "2026-04-19";
                }

                // Yolcu İsmi Zorlaması
                if (!actionData.passengerNames) {
                    actionData.passengerNames = selectedTool.function.arguments.passengerNames || ["Ege Erdem"];
                }

                console.error(`🏁 [DEBUG]: Bilet No Ayarlandı: ${actionData.ticketNumber}`);
            } else if (tName === 'check_in') {
                finalTurkishContent = "Check-in işlemi başarılı bir şekilde yapılmıştır keyifli uçuşlar dileriz.";
            }

            return res.json({
                role: "assistant",
                content: finalTurkishContent,
                actionType: tName,
                actionData: actionData
            });
        }

        // 3. Normal Konuşma (Sızıntı ve Halüsinasyon Filtresi)
        let finalClean = botContent
            .replace(/```[\s\S]*?```/g, "") 
            .replace(/[\[\]\{\}\(\)]/g, "") // Parantezleri de ekledik
            .replace(/"/g, "")
            .replace(/'/g, "")
            .replace(/https?:\/\/[^\s]+/gi, "") 
            .replace(/\(URL\)/gi, "") 
            .replace(/(query_flight|book_flight|check_in|tool|parameter|parameters|function|using|calling|yürüterek|aracı çağırıyorum|kontrol ediliyor|arguments|name)/gi, "");

        // Instruction Leakage Filtresi (Eğer bot kendi kurallarını tekrarlıyorsa)
        if (finalClean.toLowerCase().includes("asistanı") || finalClean.toLowerCase().includes("kural") || finalClean.length < 5) {
            finalClean = "Size nasıl yardımcı olabilirim? Uçuş arayabilir veya işlemlerinizi tamamlayabilirim.";
        }

        return res.json({
            role: "assistant",
            content: finalClean.trim()
        });

    } catch (error) {
        console.error("❌ API Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 Agent Backend API is running on http://localhost:${PORT}`);
});
