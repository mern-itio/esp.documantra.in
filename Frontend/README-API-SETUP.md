# API Integration Setup

## Environment Configuration

To connect your frontend to the backend API, create a `.env` file in the Frontend directory:

```bash
# Frontend/.env
VITE_API_BASE_URL=http://localhost:3000
```

## Backend API Endpoints

The frontend is configured to work with these backend endpoints:

### Authentication
- **POST** `/api/auth/login` - User login
- **POST** `/api/auth/register` - User registration  
- **GET** `/api/auth/status` - Service status check

## API Integration Details

### 1. Login API
- **Endpoint**: `POST /api/auth/login`
- **Body**: `{ email: string, password: string }`
- **Response**: `{ token: string, user_id: string, type: string }`

### 2. Register API
- **Endpoint**: `POST /api/auth/register`
- **Body**: `{ fullname: string, email: string, phone: string, password: string }`
- **Response**: `{ message: string, user: object }`

### 3. Token Storage
- Access tokens are stored in `localStorage` as `accessToken`
- User data is stored in `localStorage` as `userData`
- Automatic logout on token expiration

## Development Setup

1. **Backend**: Ensure your auth service is running on port 3000
2. **Frontend**: Set the correct API base URL in `.env`
3. **CORS**: Backend should allow requests from frontend origin

## Error Handling

The frontend automatically handles:
- API request failures
- Authentication errors
- Token validation
- User session management

## Testing

To test the integration:
1. Start your backend auth service
2. Set the environment variable
3. Try logging in/registering from the frontend
4. Check browser console for any API errors
