import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import ollama from "ollama";
import readline from "readline";

const transport = new StdioClientTransport({
    command: "node",
    args: ["index.js"]
});

const mcpClient = new Client(
    { name: "flight-agent", version: "1.0.0" },
    { capabilities: {} }
);

async function startAgent() {
    await mcpClient.connect(transport);
    console.log("✅ MCP Sunucusuna (index.js) başarıyla bağlanıldı!");

    const toolsResponse = await mcpClient.listTools();
    const ollamaTools = toolsResponse.tools.map(tool => ({
        type: "function",
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema
        }
    }));

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log("✈️ Uçuş Asistanı Hazır! Mistral devrede. (Çıkmak için 'exit' yazın)");
    
    let messages = [
        { 
            role: "system", 
            content: `Sen bir uçuş asistanısın. Kullanıcı uçuş sorduğunda SADECE sana tanımlanan araçları (tools) kullanmalısın. 
            Eğer bir aracı kullanamıyorsan, yanıtını SADECE şu JSON formatında ver ki ben senin yerine çalıştırayım: 
            {"call": "query_flight", "arguments": {...}}
            ASLA açıklama yapma, ASLA kod örneği verme. Sadece işini yap.` 
        }
    ]; 

    const askQuestion = () => {
        rl.question("\nSen: ", async (userInput) => {
            if (userInput.toLowerCase() === 'exit') {
                rl.close();
                process.exit(0);
            }

            messages.push({ role: "user", content: userInput });

            try {
                console.log("🔍 [Sistem]: Mistral isteği analiz ediyor...");
                
                const response = await ollama.chat({
                    model: 'mistral',
                    messages: messages,
                    tools: ollamaTools
                });

                let toolCalls = response.message.tool_calls;

                // --- GARANTİ MEKANİZMASI ---
                // Eğer Mistral tool_calls döndürmez ama metin içinde JSON verirse onu yakala
                if (!toolCalls || toolCalls.length === 0) {
                    const content = response.message.content;
                    if (content.includes('{"') || content.includes('query_flight')) {
                        try {
                            // Metin içindeki JSON benzeri yapıyı temizle ve objeye çevir
                            const cleanJson = content.replace(/```json|```/g, "").trim();
                            const parsed = JSON.parse(cleanJson);
                            toolCalls = [{
                                function: {
                                    name: parsed.call || "query_flight",
                                    arguments: parsed.arguments || parsed
                                }
                            }];
                        } catch (e) { /* JSON değilse normal devam et */ }
                    }
                }

                if (toolCalls && toolCalls.length > 0) {
                    for (const toolCall of toolCalls) {
                        console.log(`\n⚙️ [Sistem]: '${toolCall.function.name}' aracılığıyla veritabanına bağlanılıyor...`);
                        
                        const toolResult = await mcpClient.callTool({
                            name: toolCall.function.name,
                            arguments: toolCall.function.arguments
                        });

                        const resultText = toolResult.content[0].text;
                        
                        messages.push(response.message);
                        messages.push({
                            role: 'tool',
                            content: resultText,
                            name: toolCall.function.name
                        });
                    }

                    const finalResponse = await ollama.chat({
                        model: 'mistral',
                        messages: messages
                    });
                    
                    console.log(`\n🤖 Asistan: ${finalResponse.message.content}`);
                } else {
                    console.log(`\n🤖 Asistan: ${response.message.content}`);
                }

            } catch (error) {
                console.error("\n❌ Bir hata oluştu:", error.message);
            }
            askQuestion(); 
        });
    };
    askQuestion();
}

startAgent();