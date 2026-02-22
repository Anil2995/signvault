
# DocSigner - MERN Stack Digital Signature Workflow

A comprehensive digital signature application built with the MERN stack (MongoDB, Express, React, Node.js) and Vite. This project allows users to upload PDF documents, place designated signature areas, sign them digitally (draw or type), and generate finalized signed PDFs, complete with email notifications.

![Status](https://img.shields.io/badge/Status-Complete-green)

## 🚀 Features

### Core Functionality
-   **User Authentication**: Register, Login, Logout (JWT-based).
-   **Password Recovery**: Secure Forgot/Reset Password flow via Email.
-   **Document Management**: Upload and view PDF documents securely.
-   **Interactive Signing**:
    -   Drag-and-drop signature placeholders onto the PDF.
    -   Draw signatures using a canvas.
    -   Type signatures with stylish fonts.
-   **PDF Processing**:
    -   Backend embeds signatures directly into the PDF file (`pdf-lib`).
    -   Generates a new, finalized signed document.
-   **Notifications**: Automated emails sent with the signed PDF attached (`Nodemailer`).

### Tech Stack
-   **Frontend**: React (Vite), TypeScript, TailwindCSS, `react-pdf`, `dnd-kit`, `react-signature-canvas`.
-   **Backend**: Node.js, Express, MongoDB/Mongoose.
-   **Utilities**: `pdf-lib` (PDF manipulation), `nodemailer` (Emails), `multer` (File upload).

## 🛠️ Setup & Installation

### Prerequisites
-   Node.js (v18+)
-   MongoDB (Local or Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/docsigner.git
cd docsigner
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in `/server`:
```env
MONGO_URI=mongodb://localhost:27017/signapp
PORT=5000
JWT_SECRET=your_super_secret_key
CLIENT_URL=http://localhost:5173
# Email Credentials (use App Password for Gmail)
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

Run the server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
```

Create a `.env` file in `/client` (optional, as vite defaults are set):
```env
VITE_API_URL=http://localhost:5000/api
VITE_SERVER_URL=http://localhost:5000
```

Run the client:
```bash
npm run dev
```

## 📧 Email Configuration
For the Forgot Password and Signed Document emails to work:
1.  Enable 2-Step Verification on your Google Account.
2.  Generate an **App Password** (search "App passwords" in Google Account Security).
3.  Use this App Password as `EMAIL_PASSWORD` in `server/.env`.

## 📦 Deployment

### Frontend (Vercel)
-   Root directory: `client`
-   Build command: `npm run build`
-   Output directory: `dist`
-   Environment Variables: Set `VITE_API_URL` to your production backend URL.

### Backend (Render/Heroku)
-   Root directory: `server`
-   Build command: `npm install`
-   Start command: `node index.js`
-   Environment Variables: Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (production frontend URL), and Email credentials.

## 📝 Usage Flow
1.  **Register** a new account.
2.  **Upload** a PDF from the Dashboard.
3.  Click the **Eye Icon** to open the document.
4.  **Add Signature**: Click "Add Signature" and drag the placeholder to the desired spot.
5.  **Sign**: Click "Sign" on the placeholder -> Draw or Type your signature -> Apply.
6.  **Download**: Click "Download" in the header. This will finalize the PDF and email it to you.

## 📄 License
MIT
