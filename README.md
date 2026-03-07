# AI-Powered Study Planner (Full-Stack)

A premium study planning application with AI-driven insights, persistent task management, and interactive scheduling.

## 🚀 Features

- **AI Study Architect**: Generate personalized, multi-week study roadmaps using Gemini AI.
- **Interactive Calendar**: Schedule and track study sessions with date-fns integration.
- **Study Dashboard**: Monitor progress with analytics widgets and activity charts.
- **Task Persistence**: Full CRUD operations for study tasks stored in MongoDB.
- **Modern UI**: Dark-themed glassmorphism design with responsive navigation.

---

## 🛠️ Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally or a cloud instance)
- Gemini API Key (from [Google AI Studio](https://aistudio.google.com/))

### 1. Backend Setup
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/studyplanner
   GEMINI_API_KEY=your_actual_gemini_api_key
   ```
4. Start the server (development mode):
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. From the project root, install dependencies:
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 📦 Tech Stack

- **Frontend**: React, Vite, Lucide Icons, Recharts, Framer Motion.
- **Backend**: Node.js, Express.
- **Database**: MongoDB, Mongoose.
- **AI**: Google Gemini Pro API.

## 📝 Configuration Note
The frontend expects the backend to be running on `http://localhost:5000`. If you change the server port, update the `API_URL` in `src/services/api.js`.
