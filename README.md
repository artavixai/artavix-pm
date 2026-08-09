# Artavix PM - Enterprise Project Management System

Artavix PM is a full-stack, production-ready Project Management and Resource Planning application designed for software delivery, workflow automation, and real-time team collaboration.

## 🚀 Key Features

- **Hierarchical Project WBS:** Multi-level parent and sub-project structure with weighted progress aggregation.
- **Interactive Gantt Timeline:** Real-time Gantt schedule with drag-and-drop task resizing and progress adjustments.
- **Unified Weekly Planning:** Specialist capacity management, workload tracking, and interactive planning grids.
- **Real-Time Collaboration Hub:** Built-in SignalR chat with direct messages, channels, file sharing, and location tag support.
- **Automated Process & Form Engine:** Standardized project templates, dynamic checklist step execution, and deliverable tracking.
- **Advanced Analytics & Live Monitoring:** Dashboard metrics, workload distribution donut charts, and automated critical delay alerts.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 + Vite
- **Styling:** TailwindCSS + Framer Motion
- **Charts:** Recharts
- **Icons:** Lucide React & Heroicons
- **Real-Time Client:** @microsoft/signalr

### Backend
- **Framework:** .NET 9 Web API
- **Database:** SQLite (`artavix.db` - Entity Framework Core)
- **Real-Time Engine:** ASP.NET Core SignalR
- **Scraping & Integration:** PuppeteerSharp & ExcelDataReader
- **Authentication:** JWT Bearer Tokens with Role-Based Access Control (RBAC)

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- .NET 9 SDK

### Local Setup & Execution

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/artavix-pm.git
   cd artavix-pm