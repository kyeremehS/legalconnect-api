# LegalConnect API

A comprehensive REST API for the LegalConnect platform, providing user authentication, lawyer management, and legal services functionality.

## 🚀 Features

- **User Management**: Registration, authentication, and profile management
- **Lawyer Profiles**: Complete lawyer directory with search and filtering
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod schema validation for all endpoints
- **TypeScript**: Full TypeScript support for type safety

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Validation**: Zod
- **Development**: Nodemon, ts-node

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

## 🚀 Getting Started

### 1. Clone & Install
```bash
cd legalconnect-api
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/legalconnect"
JWT_SECRET="your-super-secret-jwt-key"
PORT=4000
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed with sample data
npx ts-node seedDatabase.ts
```

### 4. Start Development Server
```bash
npm run dev
```

The API will be available at `http://localhost:4000`

## 📚 API Documentation

### Base URL
```
http://localhost:4000
```

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 🔗 API Endpoints

### 🏠 Health Check
```http
GET /
GET /health
```

### 👥 User Management

#### Register User
```http
POST /api/users/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "role": "CLIENT",
  "password": "password123"
}
```

#### Login User
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get All Users
```http
GET /api/users
```

#### Get User by ID
```http
GET /api/users/:id
```

#### Update User
```http
PUT /api/users/:id
Content-Type: application/json

{
  "firstName": "Updated Name",
  "email": "updated@example.com"
}
```

#### Delete User
```http
DELETE /api/users/:id
```

### ⚖️ Lawyer Management

#### Get All Lawyers
```http
GET /api/lawyers
```

#### Search Lawyers
```http
GET /api/lawyers/search?practiceArea=Corporate&location=Accra&experience=5&search=tax
```

#### Search by Practice Areas
```http
GET /api/lawyers/search/practice-areas?practiceArea=Corporate Law
```

#### Search by Location
```http
GET /api/lawyers/search/location?location=Accra
```

#### Search by Experience
```http
GET /api/lawyers/search/experience?minExperience=5&maxExperience=15
```

#### Get Lawyer by ID
```http
GET /api/lawyers/:id
```

#### Create Lawyer Profile
```http
POST /api/lawyers
Content-Type: application/json

{
  "userId": "user-id-here",
  "firm": "Law Firm Name",
  "location": "Accra",
  "practiceAreas": ["Corporate Law", "Tax Law"],
  "experience": 10,
  "professionalSummary": "Experienced corporate lawyer...",
  "education": "University of Ghana Law School",
  "barAssociation": "Ghana Bar Association"
}
```

#### Update Lawyer Profile
```http
PUT /api/lawyers/:id
Content-Type: application/json

{
  "firm": "Updated Firm Name",
  "experience": 12
}
```

#### Delete Lawyer Profile
```http
DELETE /api/lawyers/:id
```

#### Get Lawyer by User ID
```http
GET /api/lawyers/user/:userId
```

## 📁 Project Structure

```
legalconnect-api/
├── controllers/          # Request handlers
│   ├── user.controller.ts
│   └── lawyer.controller.ts
├── dto/                  # Data Transfer Objects & Validation
│   ├── index.ts
│   ├── UserDto.ts
│   └── LawyerDto.ts
├── middlewares/          # Express middlewares
│   ├── index.ts
│   └── validation.middleware.ts
├── prisma/              # Database schema & migrations
│   ├── schema.prisma
│   ├── prismaClient.ts
│   └── migrations/
├── repositories/        # Data access layer
│   ├── user.repository.ts
│   └── lawyer.repository.ts
├── routes/             # API route definitions
│   ├── user.routes.ts
│   └── lawyer.routes.ts
├── services/           # Business logic layer
│   ├── user.service.ts
│   └── lawyer.service.ts
├── utils/              # Utility functions
│   └── bcrypt.ts
├── index.ts            # Application entry point
└── seedDatabase.ts     # Database seeding script
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npx prisma studio` - Open Prisma database studio
- `npx prisma migrate dev` - Run database migrations
- `npx ts-node seedDatabase.ts` - Seed database with sample data

## 🗃️ Database Schema

### User Model
- Authentication and profile information
- Roles: CLIENT, LAWYER, ADMIN
- Password hashing with bcrypt

### Lawyer Model
- Professional information and credentials
- Practice areas and specializations
- Search and filtering capabilities

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Zod schema validation
- **CORS**: Cross-origin request handling
- **SQL Injection Protection**: Prisma ORM parameterized queries

## 🔍 Search & Filtering

The lawyer search endpoint supports multiple filters:
- **Practice Area**: Filter by legal specialization
- **Location**: Geographic filtering
- **Experience**: Minimum/maximum years of experience
- **Text Search**: Search in names, firms, and descriptions

## 🚦 Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ /* validation errors if any */ ]
}
```

## 🐛 Debugging

1. **Database Connection Issues**: Check DATABASE_URL in .env
2. **JWT Errors**: Verify JWT_SECRET is set
3. **Validation Errors**: Check request body against Zod schemas
4. **CORS Issues**: Ensure frontend origin is allowed

## 📈 Performance

- **Database Queries**: Optimized with Prisma
- **Validation**: Fast Zod schema validation
- **Search**: Efficient database indexes for search operations

## 🤝 Contributing

1. Follow TypeScript best practices
2. Add proper validation for new endpoints
3. Update this README for new features
4. Ensure all endpoints return consistent response format

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for LegalConnect Platform**