import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";

// .env dosyasındaki bilgileri okur
dotenv.config();

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:5001/api/v1/flights";
const AUTH_TOKEN = process.env.AUTH_TOKEN;

// Token gerektiren endpoint'ler (bilet alma, check-in) için yetkili axios istemcisi
const apiClient = axios.create({
    headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
});

const server = new Server(
    { name: "flight-mcp-server", version: "1.0.0" },
    { capabilities: { tools: {} } }
);

// --- 1. KISIM: LLM'e Hangi Yetenekleri Olduğunu Söylüyoruz ---
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "query_flight",
                description: "Uçuşları havalimanı, tarih ve yolcu sayısına göre sorgular.",
                inputSchema: {
                    type: "object",
                    properties: {
                        dateFrom: { type: "string", description: "Gidiş tarihi (YYYY-MM-DD)" },
                        dateTo: { type: "string", description: "Dönüş tarihi (YYYY-MM-DD), eğer yolculuk tek yön ise dateFrom ile aynı olmalıdır." },
                        returnDateFrom: { type: "string", description: "(Opsiyonel) Eğer ROUND_TRIP ise dönüş başlangıç tarihi (YYYY-MM-DD)" },
                        returnDateTo: { type: "string", description: "(Opsiyonel) Eğer ROUND_TRIP ise dönüş bitiş tarihi (YYYY-MM-DD)" },
                        airportFrom: { type: "string", description: "Kalkış havalimanı (Örn: IST)" },
                        airportTo: { type: "string", description: "Varış havalimanı (Örn: FRA)" },
                        numberOfPeople: { type: "integer", description: "Yolcu sayısı" },
                        tripType: { type: "string", enum: ["ONE_WAY", "ROUND_TRIP"], description: "Yolculuk tipi" }
                    },
                    required: ["dateFrom", "airportFrom", "airportTo", "numberOfPeople", "tripType"]
                }
            },
            {
                name: "book_flight",
                description: "Belirli bir uçuş için bilet satın alır.",
                inputSchema: {
                    type: "object",
                    properties: {
                        flightNumber: { type: "string", description: "Uçuş numarası (Örn: TK1523)" },
                        date: { type: "string", description: "Uçuş tarihi (YYYY-MM-DD)" },
                        passengerNames: {
                            type: "array",
                            items: { type: "string" },
                            description: "Yolcuların tam isimlerini içeren liste"
                        }
                    },
                    required: ["flightNumber", "date", "passengerNames"]
                }
            },
            {
                name: "check_in",
                description: "Bileti olan bir yolcu için check-in işlemini yapar ve koltuk atar.",
                inputSchema: {
                    type: "object",
                    properties: {
                        flightNumber: { type: "string", description: "Uçuş numarası" },
                        date: { type: "string", description: "Uçuş tarihi (YYYY-MM-DD)" },
                        passengerName: { type: "string", description: "Check-in yapacak yolcunun tam ismi" }
                    },
                    required: ["flightNumber", "date", "passengerName"]
                }
            }
        ]
    };
});

// --- 2. KISIM: LLM Bir Yeteneği Kullanmak İstediğinde Java API'ye İstek Atıyoruz ---
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "query_flight") {
            // Defansif mantık: Eğer dateTo eksikse dateFrom ile aynı yap (ONE_WAY için yaygın hata)
            if (!args.dateTo && args.dateFrom) {
                args.dateTo = args.dateFrom;
            }
            const response = await axios.get(`${GATEWAY_URL}/query`, { params: args });
            return {
                content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
            };
        } 
        else if (name === "book_flight") {
            const response = await apiClient.post(`${GATEWAY_URL}/tickets`, args);
            return {
                content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
            };
        } 
        else if (name === "check_in") {
            const response = await apiClient.post(`${GATEWAY_URL}/check-in`, args);
            return {
                content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
            };
        } 
        else {
            throw new Error(`Bilinmeyen araç çağrısı: ${name}`);
        }
    } catch (error) {
        const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        return {
            content: [{ type: "text", text: `API İşlem Hatası: ${errorMsg}` }],
            isError: true
        };
    }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("✈️ Flight MCP Server çalışıyor...");