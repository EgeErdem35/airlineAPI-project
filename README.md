# Airline AI Agent System - SE 4458 Final Project

**GitHub Repository:** [https://github.com/EgeErdem35/airlineAPI-project](https://github.com/EgeErdem35/airlineAPI-project)

## 🚀 Project Overview
This project is an end-to-end AI-powered Airline Ticketing System. It integrates a robust Java Spring Boot backend (Midterm Project) with a modern React Frontend and a specialized AI Agent Backend using the **Model Context Protocol (MCP)**. The system allows users to search, book, and check-in to flights using natural language through an intelligent chat interface.

---

## 🏗️ Architecture Mapping
The system follows a modular, agentic architecture to fulfill all assignment requirements:

1.  **Frontend (UI):** React-based Chat Application.
2.  **Agent Backend:** Node.js Express server acting as the orchestrator.
3.  **LLM (Brain):** Ollama running the **Mistral** model for intent parsing and tool selection.
4.  **MCP Server:** A dedicated Model Context Protocol server that exposes Midterm APIs as tools.
5.  **API Gateway:** Spring Cloud Gateway (Port 5001) that routes agent requests to the backend.
6.  **Core API:** Java Spring Boot application (Port 5000) managing the database and business logic.

---

## ✅ Requirements Compliance Checklist (Final Assignment)

| Requirement | Status | Implementation Detail |
| :--- | :---: | :--- |
| **AI Agent Chat App** | 🟢 | Full chat interface for Flight Query, Booking, and Check-in. |
| **Web Frontend Framework** | 🟢 | Built with **React** & **Vite**. |
| **Gateway Integration** | 🟢 | All MCP tool calls are routed through the **Spring Cloud Gateway**. |
| **LLM Integration** | 🟢 | **Ollama / Mistral** is used for intent parsing and parameter extraction. |
| **MCP Server** | 🟢 | Functional **Node.js MCP Server** handling tool definitions and execution. |
| **Tool Calling Logic** | 🟢 | LLM decides which tool (query, book, check-in) to call based on user input. |
| **Step-by-Step Workflow** | 🟢 | Implemented a clean Search -> Book -> Check-in sequential flow. |
| **Constant Auth** | 🟢 | Agent uses a persistent **JWT Bearer Token** for authenticated API calls. |
| **Technical Cleanup** | 🟢 | All JSON/Tool fragments are filtered to ensure natural language responses. |

---

## 🛠️ Technology Stack

### **1. AI & Orchestration**
- **LLM:** Ollama (Mistral-7B)
- **Agent Server:** Node.js, Express.js
- **Protocol:** Model Context Protocol (MCP) SDK
- **Intent Parsing:** LLM Tool Calling & Regex Fallbacks

### **2. Frontend (Chat Application)**
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **API Client:** Axios

### **3. Backend (Midterm API)**
- **Language:** Java 21
- **Framework:** Spring Boot 3.x
- **Gateway:** Spring Cloud Gateway
- **ORM/DB:** Spring Data JPA, MySQL
- **Security:** JWT (JSON Web Tokens)

---

## 🧭 Step-by-Step AI Agent Workflow

The system is designed for a seamless three-step user journey:

1.  **Step 1: Flight Query**
    - *User:* "Bugün İstanbul'dan Frankfurt'a uçuş var mı?"
    - *Agent:* Queries availability and shows flight cards (e.g., **TK1523**).
2.  **Step 2: Direct Booking**
    - *User:* "I would like to book flight TK1523 for Ege Erdem."
    - *Agent:* Executes a secure booking through the Gateway.
    - *Response:* "Biletiniz başarılı bir şekilde satın alınmıştır." (with ticket details).
3.  **Step 3: Contextual Check-in**
    - *User:* "Check-in yapmak istiyorum."
    - *Agent:* Recognizes the flight number from the previous context and completes the check-in.
    - *Response:* Shows the digital Boarding Pass.

---

## ⚙️ How to Run Locally

### **Prerequisites**
- Java 21+, Node.js 20+, Ollama, MySQL.
- Ollama: Run `ollama serve` and `ollama pull mistral`.

### **1. Start Core Backend**
```bash
cd backend
./mvnw spring-boot:run
```

### **2. Start API Gateway**
```bash
cd gateway
./mvnw spring-boot:run
```

### **3. Start AI Agent (MCP Server & API)**
```bash
cd flight-mcp-server
npm install
npm start
```

### **4. Start Frontend UI**
```bash
cd frontend
npm install
npm run dev
```
Accessible at: [http://localhost:5173](http://localhost:5173)

---

## 📂 Project Structure
```text
airlineapi-project/
├── backend/                  # Spring Boot Midterm API
├── gateway/                  # Spring Cloud Gateway (Port 5001)
├── flight-mcp-server/        # AI Agent & MCP Server (Port 3001)
│   ├── server.js             # Agent Orchestrator & Cleanup Logic
│   ├── index.js              # MCP Server Implementation
│   └── .env                  # Auth Tokens & Gateway URLs
├── frontend/                 # React Chat Application (Port 5173)
│   ├── src/App.jsx           # Intent-driven UI Logic
│   └── src/index.css         # Modern Tailwind CSS Styles
└── README.md                 # Project Documentation
```
