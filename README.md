# mern-e2ee-chat-app



mern-e2ee-chat-app/
│
├── backend/
│   ├── config/
│   │   └── db.js                 # Database connection (MongoDB)
│   ├── controllers/
│   │   ├── authController.js     # User Register, Login, Public key handle karna
│   │   └── messageController.js  # Chat history aur file links fetch karna
│   ├── middlewares/
│   │   ├── authMiddleware.js     # Token (JWT) verify karne ke liye
│   │   ├── validationMiddleware.js# Input data check karne ke liye (express-validator)
│   │   └── errorMiddleware.js    # Global error handling ke liye
│   ├── models/
│   │   ├── User.js               # User schema (Username, Email, Password, PublicKey)
│   │   └── Message.js            # Encrypted Message & File schema
│   ├── routes/
│   │   ├── authRoutes.js         # API routes: /api/auth
│   │   └── messageRoutes.js      # API routes: /api/messages
│   ├── socket/
│   │   └── socket.js             # Encrypted Messages, File sharing & Video/Audio signaling
│   ├── .env                      # Environment variables
│   ├── package.json
│   └── index.js                  # Main server entry point (Express + Socket.io server)
│
└── frontend/
    ├── src/
    │   ├── components/           # UI Layout components
    │   │   ├── Auth.jsx          # Login & Signup Form
    │   │   ├── Chat.jsx          # Main messaging & file upload screen
    │   │   └── VideoCall.jsx     # WebRTC Audio/Video Call UI
    │   ├── crypto/
    │   │   └── webCrypto.js      # Encrypt & Decrypt functions (Text, Images, PDFs)
    │   ├── App.jsx               # Main Routing & App View
    │   └── main.jsx              # React Entry Point
    ├── package.json
    └── vite.config.js