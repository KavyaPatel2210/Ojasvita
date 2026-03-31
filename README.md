# 🌿 Ojasvita - Personalized Diet & Calorie monitoring system

![Ojasvita Banner](https://images.unsplash.com/photo-1490818387583-1baba5e638af?q=80&w=1200&h=400&auto=format&fit=crop)

Ojasvita is a comprehensive health and wellness platform designed to help users track their nutrition, stay hydrated, and achieve their fitness goals through a personalized, data-driven approach.

## ✨ Key Features

### 🥗 Calorie & Nutrition Tracking
- **Extensive Food Database**: Access thousands of food items with detailed nutritional information.
- **Easy Logging**: Quickly log your breakfast, lunch, dinner, and snacks.
- **Nutritional Breakdown**: View your daily intake of proteins, carbs, fats, and more.

### 💧 Hydration Monitoring
- **Daily Water Goals**: Set personalized hydration targets based on your activity level.
- **Visual Tracking**: Monitor your water intake throughout the day with an intuitive progress interface.
- **Smart Reminders**: Get notified to stay hydrated.

### 🎯 Goal Management
- **Personalized Targets**: Set weight loss, maintenance, or muscle gain goals.
- **BMI Calculator**: Integrated tool to calculate and track your Body Mass Index.
- **Adaptive Planning**: The system updates your calorie needs as you progress toward your goals.

### 📊 Advanced Analytics
- **Visual Progress**: Real-time charts and graphs powered by Recharts.
- **Trend Analysis**: Monitor your weight and calorie trends over weeks or months.
- **Achievement Streaks**: Stay motivated with daily consistency tracking.

### 🔔 Smart Notifications
- **Meal Reminders**: Never miss a log with timely reminders.
- **Water Alerts**: Stay on top of your hydration with push notifications.
- **Goal Milestones**: Get notified when you reach significant progress markers.

### 🛡️ Admin Dashboard
- **User Management**: Overview of active users and system stats.
- **Data Monitoring**: Track overall platform engagement and health metrics.

---

## 🛠️ Technology Stack

**Frontend:**
- **React.js**: Modern component-based UI.
- **Vite**: Ultra-fast build tool.
- **Tailwind CSS**: Utility-first styling for a premium aesthetic.
- **Recharts**: Dynamic data visualization.
- **Lucide Icons**: Crisp, modern iconography.

**Backend:**
- **Node.js**: Scalable server-side environment.
- **Express.js**: Robust API routing and middleware.
- **MongoDB**: Flexible NoSQL database with Mongoose ODM.
- **JWT**: Secure token-based authentication.

**DevOps & Services:**
- **Web Push API**: Standard-based push notifications.
- **Vercel**: Optimized frontend hosting.
- **Node-cron**: Scheduled tasks for daily resets and analytics.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16.0.0 or higher)
- MongoDB account (Atlas or local)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/KavyaPatel2210/Ojasvita.git
   cd ojasvita
   ```

2. **Install Backend Dependencies:**
   ```bash
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Environment Setup:**
   Create a `.env` file in the root directory and add your configurations:
   ```env
   # SERVER SETUP
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   
   # VAPID KEYS (for Push Notifications)
   VAPID_PUBLIC_KEY=your_public_key
   VAPID_PRIVATE_KEY=your_private_key
   ```

5. **Run the Application:**
   ```bash
   # Run Backend (Root directory)
   npm run dev

   # Run Frontend (In a separate terminal, inside /frontend)
   npm run dev
   ```

---

## 📸 Project Screenshots

*(Add your screenshots here)*

---

## 👥 Contributors

- **Ojasvita Team** - [KavyaPatel2210](https://github.com/KavyaPatel2210)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">Made with ❤️ for a Healthier You</p>
