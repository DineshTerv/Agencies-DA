# Dinesh Agencies - FMCG Wholesale & Distribution
Smarter Distribution • Stronger Business • For a Better Tomorrow

Dinesh Agencies is a comprehensive B2B/B2C FMCG (Fast-Moving Consumer Goods) wholesale web application built to streamline operations between administrators, delivery workers, and retail customers.

---

## 🚀 Tech Stack

### Frontend
- **React 18**
- **Vite**
- **React Router DOM**
- **Vanilla CSS**
- **Lucide React**
- **React Hooks**

### Backend
- **Node.js**
- **Express.js**
- **MongoDB**
- **JWT** (JSON Web Tokens)
- **AWS S3 / Cloudinary**

---

## 🔄 System Flow

1. **Users access the web app** (Customer / Worker / Admin)
2. **Frontend handles UI & auth** (React + Vite)
3. **API calls go to backend** (Node.js + Express)
4. **Services interact with database** (MongoDB / Cache)
5. **Response sent back to frontend**

---

## 🌟 Key Features

### 🛒 Customer Portal
- Top brands marquee
- Product categories
- Price calculation & discounts
- Quick cart controls
- Out of stock handling

### 🚚 Worker Dashboard
- Assigned orders
- Delivery status update
- Manual ordering

### 📊 Admin Dashboard
- Order management
- Worker assignment
- Inventory & analytics

---

## 🏛️ System Architecture

```mermaid
graph TD
    %% Define Styles
    classDef users fill:#FDE0DF,stroke:#E74C3C,stroke-width:2px,color:#000;
    classDef worker fill:#E8F5E9,stroke:#2ECC71,stroke-width:2px,color:#000;
    classDef admin fill:#FEF3E1,stroke:#E67E22,stroke-width:2px,color:#000;
    classDef frontend fill:#E3F2FD,stroke:#3498DB,stroke-width:2px,color:#000;
    classDef backend fill:#E8F5E9,stroke:#27AE60,stroke-width:2px,color:#000;
    classDef database fill:#F4F6F6,stroke:#7F8C8D,stroke-width:2px,color:#000;

    %% Users
    subgraph Users [Users Access through Web App]
        direction LR
        Customer["Customer (B2C / Retailers)<br>• Browse products<br>• Place orders<br>• Track delivery"]:::users
        Worker["Delivery Worker (Field Executive)<br>• View assigned orders<br>• Update delivery status<br>• Place manual orders"]:::worker
        Admin["Admin (Business Owner)<br>• Manage orders<br>• Assign delivery workers<br>• Track inventory & analytics"]:::admin
    end

    %% Frontend App
    subgraph FrontendApp [Frontend Application React + Vite]
        direction TB
        Router["App Router"]:::frontend
        Auth["Auth Service / Login"]:::frontend
        
        CustPortal["Customer Portal<br>• Product catalog<br>• Cart & checkout<br>• Product details<br>• Related products<br>• Offers & discounts"]:::users
        WorkerDash["Worker Dashboard<br>• Assigned orders<br>• Delivery status update<br>• Manual order placement<br>• Product catalog"]:::worker
        AdminDash["Admin Dashboard<br>• Order management<br>• Assign workers<br>• Inventory tracking<br>• Sales analytics"]:::admin
        
        Router --> Auth
        Auth --> CustPortal
        Auth --> WorkerDash
        Auth --> AdminDash
    end

    %% Backend Server
    subgraph BackendServer [Backend Server Node.js + Express]
        direction TB
        APIGateway["API Gateway / Routes"]:::backend
        
        ProductSvc["Product Service<br>• Product CRUD<br>• Inventory management"]:::backend
        OrderSvc["Order Management Service<br>• Order processing<br>• Assign to workers<br>• Status updates"]:::backend
        AuthSvc["Auth & User Service<br>• JWT authentication<br>• User management<br>• Roles & permissions"]:::backend
        
        APIGateway --> ProductSvc
        APIGateway --> OrderSvc
        APIGateway --> AuthSvc
    end

    %% Data Layer
    subgraph DataLayer [Data Layer]
        direction LR
        MongoDB[("MongoDB<br>(Primary Database)")]:::database
        CloudStorage[("Cloud Storage AWS S3 / Cloudinary<br>(Product Images & Files)")]:::database
        MongoDB <--> CloudStorage
    end

    %% Connections
    Customer --> FrontendApp
    Worker --> FrontendApp
    Admin --> FrontendApp

    CustPortal -.-> APIGateway
    WorkerDash -.-> APIGateway
    AdminDash -.-> APIGateway

    ProductSvc --> MongoDB
    OrderSvc --> MongoDB
    AuthSvc --> MongoDB
```

---

## 🛠️ Deployment & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
1. `cd frontend`
2. `npm install`
3. `npm run dev`

---

*Seamless Ordering For Customers • Efficient Delivery For Workers • Complete Control For Admins*
*Built with Modern Tech: React 18 | Node.js | MongoDB*
