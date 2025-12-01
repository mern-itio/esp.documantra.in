# Support Chat System - Quick Setup Guide

## 🚀 Quick Start

### 1. Create Agent Account

Run this command to create your first agent:

```bash
cd Backend/services/support-service
node scripts/createAgent.js agent@draftnsign.com agent123 "Support Agent" agent
```

Or create manually via MongoDB:
- Email: agent@draftnsign.com
- Password: agent123 (will be hashed automatically)
- Role: agent

### 2. Agent/Admin Login

Navigate to: `http://localhost:5173/support/login`

Use credentials:
- Email: agent@draftnsign.com
- Password: agent123

### 3. Support Dashboard

After login, you'll be redirected to: `http://localhost:5173/support/dashboard`

## 📁 Files Created

### Backend
- ✅ `Backend/services/support-service/` - Complete microservice
- ✅ All models, controllers, routes, Socket.IO server
- ✅ Scripts to create agents

### Frontend
- ✅ `Frontend/src/pages/SupportChat/SupportDashboard.tsx` - **Unified Agent/Admin Dashboard**
- ✅ `Frontend/src/pages/SupportChat/AgentLogin.tsx` - Agent login page
- ✅ `Frontend/src/components/SupportChat/CustomerChatWidget.tsx` - Customer widget
- ✅ `Frontend/src/context/SupportChatContext.tsx` - Socket.IO context
- ✅ `Frontend/src/services/supportService.ts` - API service

## 🔧 Configuration

### Backend `.env` (Backend/services/support-service/.env)
```env
PORT=2107
MONGO_URI=mongodb://localhost:27017/draftsign
ACCESS_TOKEN_SECRET=your_jwt_secret
AGENT_ACCESS_TOKEN_SECRET=your_agent_jwt_secret
ADMIN_ACCESS_TOKEN_SECRET=your_admin_jwt_secret
CORS_ORIGIN=http://localhost:5173
```

### Frontend `.env` (Frontend/.env)
```env
VITE_SUPPORT_SERVICE_URL=http://localhost:2107
```

## 📝 Routes Added

The following routes have been added to your router:

```typescript
{ path: '/support/login', element: <AgentLogin /> }
{ path: '/support/dashboard', element: <SupportDashboard /> }
```

## 🎯 Features Implemented

### Agent Dashboard
- ✅ View assigned tickets
- ✅ Real-time chat with customers
- ✅ Status toggle (Online/Offline/Away)
- ✅ Ticket transfer
- ✅ Close tickets
- ✅ View customer details

### Admin Dashboard
- ✅ View all tickets
- ✅ Manage agents (view, create, delete)
- ✅ Ticket reassignment
- ✅ Analytics dashboard
- ✅ Agent statistics

### Customer Widget
- ✅ Floating chat widget
- ✅ Create tickets
- ✅ Real-time messaging
- ✅ File uploads
- ✅ Rating system

## 🔍 Troubleshooting

### "Not connected or no active ticket" error
1. Make sure Socket.IO is connected (check browser console)
2. Ensure ticket is created and joined to socket room
3. Check if agent is assigned to ticket

### Messages not sending
1. Check Socket.IO connection status
2. Verify ticket is selected in context
3. Check browser console for errors

### Agent login fails
1. Create agent account first using the script
2. Check MongoDB connection
3. Verify JWT secrets in .env

## 📊 Next Steps

1. **Create Agent Account**: Run the script above
2. **Test Customer Flow**: Create ticket from customer widget
3. **Test Agent Flow**: Login as agent and respond
4. **Test Admin Flow**: Login as admin and view analytics

## 🎨 Customization

The dashboard is designed to work as both agent and admin dashboard. It automatically detects the user role and shows appropriate features.

To customize:
- Edit `Frontend/src/pages/SupportChat/SupportDashboard.tsx`
- Colors use `#260559` (your brand color)
- Components are modular and easy to modify

