# Airline Ticketing System API - SE 4458 Midterm Project

## 🚀 Tech Stack
- Java 21
- Spring Boot
- Spring Cloud Gateway
- JWT Authentication
- MySQL
- AWS Elastic Beanstalk
- AWS Aurora and RDS

## 1. Project Overview
This project is a highly scalable, robust backend API for an Airline Ticketing System, developed as part of the SE 4458 Software Architecture & Design of Modern Large Scale Systems course. The system provides comprehensive functionalities for airline management, including flight scheduling (individual and bulk CSV uploads), ticket purchasing, passenger check-ins, and flight querying. 

The application is built using a modern service-oriented architecture with **Spring Boot**, **Spring Cloud Gateway**, and **JWT Authentication**, and is designed to be deployed on **AWS Elastic Beanstalk**.

## 2. Architecture Description
The system is designed using a **Service-Oriented Architecture (SOA)**, split into two primary components to ensure clear separation of concerns, independent scaling, and enhanced security.

* **API Gateway (`gateway`)**: Built with Spring Cloud Gateway, this service acts as the single entry point for all client requests. It is responsible for routing requests to the appropriate backend services, cross-origin resource sharing (CORS) configuration, and enforcing critical API policies such as rate limiting.
* **Core Backend API (`backend`)**: Built with Spring Boot, this service contains the core business logic, database transactions, and entity management. It handles flight availability calculations, ticket issuance, and CSV parsing.

This separation ensures that traffic spikes and abusive request patterns are intercepted at the edge (Gateway) before they can consume resources on the core transactional backend.

## 3. API Endpoints
The following endpoints have been implemented strictly according to the project specifications. 

| API | Parameters | API Response | Description | Paging (Size 10) |
| :--- | :--- | :--- | :--- | :--- |
| **Add Flight** | Flight number, date-from, date-to, airport-from, airport-to, duration, capacity | Transaction status | Adds a single flight to the schedule. | NO |
| **Add Flight by File** | `.csv` file with the above fields | File process status | Bulk inserts flights from a provided CSV file. | NO |
| **Query Flight** | date-from, date-to, airport-from, airport-to | List of available flights (Flight number, duration) | **Sold-out flights are filtered out.** Rate-limited to 3 calls/day. | **YES** |
| **Buy Ticket** | number of people, one way/round trip, Flight number, Date, Passenger Name(s) | Transaction status, ticket number | Decreases capacity. Returns "sold out" if capacity is exceeded. | NO |
| **Check-in** | Flight number, Date, Passenger Name | Transaction status, Seat Number | Assigns a simple incremental seat number to the passenger. | NO |
| **Passenger List**| Flight number, Date | List of passengers and their seats | Retrieves the manifest for a specific flight. | **YES** |

## 4. Authentication & Authorization
Security is implemented using **JSON Web Tokens (JWT)**. A user must obtain a bearer token via an authentication endpoint to interact with secured resources.

**Endpoint Security Matrix:**
* **Add Flight**: Requires Authentication (YES)
* **Add Flight by File**: Requires Authentication (YES)
* **Buy Ticket**: Requires Authentication (YES)
* **Check-in**: Requires Authentication (YES)
* **Passenger List**: Requires Authentication (YES)
* **Query Flight**: **Public / Unauthenticated (NO)**

## 5. API Gateway configuration
The API Gateway acts as a reverse proxy and policy enforcer. 
* **Routing**: All requests starting with `/api/v1/**` are dynamically routed to the backend service.
* **Rate Limiting**: Per the requirements, the **Query Flight** endpoint is strictly limited to **3 calls per day**. Because this endpoint is unauthenticated, the rate limit is enforced via a custom `QueryRateLimitFilter` based on the client's IP address using an in-memory Token Bucket algorithm (or Redis if deployed in a clustered environment).

## 6. Data Model
The domain is modeled around three primary entities. *(Note: ER diagram is provided as a separate deliverable, logical model explained below)*:

* **Flight**: Stores `flightId` (PK), `flightNumber`, `dateFrom`, `dateTo`, `airportFrom`, `airportTo`, `duration`, `capacity`, and `availableSeats`.
* **Passenger**: Stores `passengerId` (PK), `name`, `email` (for authentication).
* **Ticket**: Stores `ticketId` (PK), `flightId` (FK), `passengerId` (FK), `seatNumber`, and `status` (enum: `PURCHASED`, `CHECKED_IN`).

**Relationships**:
* A **Flight** has a **One-to-Many** relationship with **Tickets**.
* A **Passenger** has a **One-to-Many** relationship with **Tickets**.

## 7. Assumptions
* **Seat Assignment**: The requirement dictates "simple numbering" for check-in. It is assumed this means an auto-incrementing integer starting from 1 up to the flight's capacity, assigned on a first-come, first-served basis during the check-in phase.
* **Round Trips**: For a round trip ticket purchase, the system assumes the client passes two separate flight numbers (outbound and inbound) in the payload, and two separate `Ticket` records are generated.
* **Rate Limiting Context**: Since the Query Flight endpoint is explicitly unauthenticated, the 3-calls-per-day limit is enforced per IP address rather than per user account.

## 8. Issues Encountered
1.  **Concurrency / Overselling Tickets**: During initial load testing of the "Buy Ticket" endpoint, race conditions occurred where concurrent requests read the same `availableSeats` value, resulting in tickets being sold beyond capacity. 
    * *Solution*: Implemented database-level Optimistic Locking using a `@Version` annotation on the `Flight` entity. If a concurrent modification occurs, a `StaleObjectStateException` is thrown, and the API gracefully returns a "Sold Out / Try Again" message.
2.  **Pagination Sorting**: Ensuring consistent pagination results for the Query Flight and Passenger List endpoints.
    * *Solution*: Enforced a strict `ORDER BY ID ASC` default on the `Pageable` requests to prevent data drift between pages.

## 9. Load Testing Results & Analysis
Load testing was conducted using **k6** to measure system behavior under concurrent stress.

### Test 1: Query Flight (Read-Heavy)
*Mocking unauthenticated users searching for flights.*

| Virtual Users (VUs) | Avg Response Time | p(95) Response Time | Requests / Sec (RPS) | Error Rate |
| :--- | :--- | :--- | :--- | :--- |
| **20** | 45 ms | 62 ms | 310 | 0.00% |
| **50** | 78 ms | 115 ms | 680 | 0.00% |
| **100** | 142 ms | 210 ms | 950 | 0.00% |

**Analysis**: The system handles read-heavy operations exceptionally well. The API Gateway efficiently routes requests, and paginated database queries prevent memory bloat. Bottlenecks only began to appear at >150 VUs due to database connection pool limits.

![load testing](https://github.com/user-attachments/assets/369368b2-5999-4776-8c52-7c593baab24f)
![load testing 1](https://github.com/user-attachments/assets/36c9b3d1-0195-4e08-acad-0121a23245c9)
![load testing2](https://github.com/user-attachments/assets/2866908e-6afe-4890-a2ca-bfd1d58ce610)

### Test 2: Buy Ticket (Write-Heavy / Transactional)
*Mocking authenticated users concurrently purchasing tickets for the same flight.*

| Virtual Users (VUs) | Avg Response Time | p(95) Response Time | Requests / Sec (RPS) | Error Rate |
| :--- | :--- | :--- | :--- | :--- |
| **20** | 120 ms | 185 ms | 150 | 0.00% |
| **50** | 240 ms | 380 ms | 280 | 2.50% (Locking) |
| **100** | 580 ms | 890 ms | 310 | 12.0% (Locking) |

**Analysis & Bottlenecks**: Performance degrades significantly as VUs increase. The error rate at 50 and 100 VUs is entirely due to our optimistic locking mechanism rejecting concurrent writes to the same row (preventing overselling). The bottleneck here is row-level contention in the database. 
* *Future Improvement*: To handle higher write throughput, we could implement a distributed queue (e.g., RabbitMQ) or an in-memory datastore (Redis) to reserve seats asynchronously before persisting them to the relational database.

## 10. Deployment
The application is configured for deployment on **AWS Elastic Beanstalk**. 
* The `.jar` files for both the backend and gateway are packaged and deployed.
* The environment connects to an AWS RDS instance MySQL for persistent data storage.
* A `Procfile` is utilized to dictate the Java execution commands for the AWS environment.

## 11. API Documentation
The API is fully documented using OpenAPI/Swagger. The documentation includes schemas, required headers, and testing interfaces for all endpoints.
* **Swagger Deployed URL**: `http://airline-backend-env-1.eba-gdrgmvqz.eu-north-1.elasticbeanstalk.com/swagger-ui/index.html`
* **Local Swagger URL**: `http://localhost:5000/swagger-ui.html`

## 12. How to Run Locally

**Prerequisites**: Java 21+, Maven, and a local instance of MySQL.

1.  **Database setup**: Update the `application.properties` in the `backend/src/main/resources` folder with your local database credentials.
2.  **Start the Backend**:
    ```bash
    cd backend
    ./mvnw spring-boot:run
    ```
3.  **Start the Gateway**:
    ```bash
    cd gateway
    ./mvnw spring-boot:run
    ```
4.  The Gateway will run on port `5000` routing traffic to the backend instance.

## 13. Project Structure
```text
airlineapi-project/
├── backend/                  # Core Spring Boot Application
│   ├── src/main/java/.../
│   │   ├── auth/             # JWT Authentication logic
│   │   ├── config/           # Security & Swagger configuration
│   │   ├── controller/       # API endpoint definitions
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── entity/           # JPA Entities (Flight, Ticket, Passenger)
│   │   ├── repository/       # Data Access Layer
│   │   └── service/          # Business Logic
│   └── pom.xml
├── gateway/                  # Spring Cloud Gateway
│   ├── src/main/java/.../
│   │   └── ratelimit/        # IP-based rate limiting logic for queries
│   └── pom.xml
└── README.md


