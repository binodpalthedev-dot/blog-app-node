# Blog App Backend

A Node.js backend for a blogging platform built with Express.js and MongoDB.

## Features

- **User Authentication** - Secure JWT-based authentication with bcrypt password hashing
- **Blog Management** - Create, read, update, and delete blog posts
- **File Uploads** - Upload images and files using multer
- **Comments System** - Readers can comment on posts
- **CORS Support** - Cross-origin requests enabled for two servers
- **Secure Cookies** - Cookie-based session management
- **Error Handling** - Comprehensive error handling and validation

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js v5.2.1
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcryptjs & bcrypt
- **File Uploads:** Multer
- **Security:** CORS, Cookie Parser
- **Environment:** dotenv
- **Development:** Nodemon

## Prerequisites

Before running this project, make sure you have:

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or cloud)
- Git

## Installation

1. **Clone the repository:**
```bash
git clone https://github.com/binodpalthedev-dot/blog-app-node.git
cd blog-app-node
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create a `.env` file in the root directory:**
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blog-app
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

## Running the Project

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── controllers/       # Business logic
│   ├── middleware/        # Custom middleware (auth, validation)
│   ├── utils/            # Helper functions
│   ├── uploads/          # File uploads directory
│   └── app.js            # Express app setup
├── .env                  # Environment variables
├── .gitignore            # Git ignore file
├── package.json          # Dependencies
└── README.md             # Documentation
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user (Auth required)

### Blogs
- `GET /api/blogs` - Get all blogs
- `GET /api/blogs/:id` - Get a specific blog
- `POST /api/blogs` - Create a new blog (Auth required)
- `PUT /api/blogs/:id` - Update a blog (Auth required)
- `DELETE /api/blogs/:id` - Delete a blog (Auth required)
- `POST /api/blogs/:id/upload` - Upload blog image (Auth required)

### Comments
- `GET /api/blogs/:id/comments` - Get blog comments
- `POST /api/blogs/:id/comments` - Add comment (Auth required)
- `DELETE /api/comments/:id` - Delete comment (Auth required)

## Environment Variables

```
PORT              - Server port (default: 5000)
MONGODB_URI       - MongoDB connection string
JWT_SECRET        - Secret key for JWT tokens
NODE_ENV          - Environment (development/production)
```

## Dependencies Overview

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^5.2.1 | Web framework |
| mongoose | ^9.6.1 | MongoDB ODM |
| jsonwebtoken | ^9.0.3 | JWT authentication |
| bcryptjs | ^3.0.3 | Password hashing |
| bcrypt | ^6.0.0 | Alternative password hashing |
| multer | ^2.1.1 | File upload handling |
| cors | ^2.8.6 | Cross-origin requests |
| cookie-parser | ^1.4.7 | Cookie management |
| dotenv | ^17.4.2 | Environment variables |
| nodemon | ^3.1.14 | Development auto-reload |

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`

3. Start the server:
```bash
npm run dev
```

4. Server will run on `http://localhost:5000`

## Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- CORS protection
- Secure cookie handling
- Input validation and sanitization
- Environment variable protection

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add YourFeature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact & Support

**Author:** Binod Pal  
**Email:** binodpalthedev@gmail.com  
**GitHub:** [@binodpalthedev-dot](https://github.com/binodpalthedev-dot)

For issues or support, please open an issue on GitHub.

---

Made with ❤️ by Binod Pal