const SupportAgent = require('../models/SupportAgent');
const Ticket = require('../models/Ticket');
const mongoose = require('mongoose');

/**
 * Route ticket to the least busy online agent
 * Uses auth-service agent IDs for ticket assignment (for consistency)
 */
const routeTicketToAgent = async (ticketId) => {
  try {
    // Find all online and active agents in support-service DB
    const agents = await SupportAgent.find({
      status: 'online',
      isActive: true
    }).sort({
      'stats.responseCount': 1, // Least responses first
      'currentTickets.length': 1 // Least tickets first
    }).limit(5); // Get top 5 candidates

    if (agents.length === 0) {
      console.log('No online agents available for ticket routing');
      return null;
    }

    // Select the agent with the least active tickets
    let selectedAgent = agents[0];
    let minTickets = selectedAgent.currentTickets.length;

    for (const agent of agents) {
      if (agent.currentTickets.length < minTickets) {
        selectedAgent = agent;
        minTickets = agent.currentTickets.length;
      }
    }

    // Use support-service agent ID for assignment (consistent with login)
    // Agents login with support-service agent IDs, so tickets should use the same
    const agentIdForAssignment = selectedAgent._id.toString();

    // Update ticket with assigned agent (using auth-service agent ID)
    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        assignedAgentId: agentIdForAssignment,
        status: 'ongoing',
        updatedAt: new Date()
      },
      { new: true }
    );

    // Add ticket to agent's current tickets (in support-service DB)
    selectedAgent.currentTickets.push({
      ticketId: ticket._id,
      assignedAt: new Date()
    });
    await selectedAgent.save();

    return {
      agent: selectedAgent,
      ticket: ticket
    };
  } catch (error) {
    console.error('Error routing ticket to agent:', error);
    return null;
  }
};

/**
 * Remove ticket from agent's current tickets when closed
 */
const removeTicketFromAgent = async (agentId, ticketId) => {
  try {
    const agent = await SupportAgent.findById(agentId);
    if (agent) {
      agent.currentTickets = agent.currentTickets.filter(
        t => t.ticketId.toString() !== ticketId.toString()
      );
      agent.stats.totalTicketsHandled += 1;
      await agent.save();
    }
  } catch (error) {
    console.error('Error removing ticket from agent:', error);
  }
};

module.exports = {
  routeTicketToAgent,
  removeTicketFromAgent
};

