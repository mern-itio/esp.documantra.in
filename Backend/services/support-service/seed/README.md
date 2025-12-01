# Agent Seeder

This seeder file creates default support agents for testing and development.

## Usage

### Run seeder (creates default agents):
```bash
cd Backend/services/support-service
npm run seed:agents
```

Or directly:
```bash
node seed/agentSeeder.js
```

## Default Agents Created

The seeder creates the following agents:

1. **Support Agent** (Regular Agent)
   - Email: `agent@draftnsign.com`
   - Password: `agent123`
   - Role: `agent`

2. **Support Admin** (Admin)
   - Email: `admin@draftnsign.com`
   - Password: `admin123`
   - Role: `admin`

3. **Agent One** (Regular Agent)
   - Email: `agent1@draftnsign.com`
   - Password: `agent123`
   - Role: `agent`

4. **Agent Two** (Regular Agent)
   - Email: `agent2@draftnsign.com`
   - Password: `agent123`
   - Role: `agent`

## Customization

To add more agents, edit the `defaultAgents` array in `seed/agentSeeder.js`:

```javascript
const defaultAgents = [
  {
    email: 'your-email@example.com',
    password: 'your-password',
    fullname: 'Agent Name',
    role: 'agent', // or 'admin'
    status: 'offline',
    isActive: true
  }
];
```

## Notes

- Passwords are automatically hashed by the SupportAgent model's pre-save hook
- Existing agents with the same email will be skipped (not overwritten)
- All agents are created with `isActive: true` and `status: 'offline'`
- The seeder will not overwrite existing agents

