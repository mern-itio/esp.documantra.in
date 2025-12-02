/**
 * Get JWT secret for agent/admin tokens
 * Uses the same priority order for both signing and verification
 */
const getAgentJWTSecret = () => {
  return process.env.AGENT_ACCESS_TOKEN_SECRET || 
         process.env.ADMIN_ACCESS_TOKEN_SECRET || 
         process.env.ACCESS_TOKEN_SECRET;
};

/**
 * Get all possible JWT secrets to try (in priority order)
 */
const getAllJWTSecrets = () => {
  return [
    process.env.AGENT_ACCESS_TOKEN_SECRET,
    process.env.ADMIN_ACCESS_TOKEN_SECRET,
    process.env.ACCESS_TOKEN_SECRET
  ].filter(s => s); // Remove undefined/null values
};

module.exports = {
  getAgentJWTSecret,
  getAllJWTSecrets
};

