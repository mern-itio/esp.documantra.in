const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');


// Get all workflows for a document
router.get('/documents/:documentId/workflows', workflowController.getDocumentWorkflows);

// Create a new workflow for a document
router.post('/documents/:documentId/workflows', workflowController.createWorkflow);

// Get a specific workflow
router.get('/workflows/:workflowId', workflowController.getWorkflow);

// Update a workflow
router.put('/workflows/:workflowId', workflowController.updateWorkflow);

// Complete a workflow step
router.patch('/workflows/:workflowId/steps/:stepId/complete', workflowController.completeWorkflowStep);

// Delete a workflow
router.delete('/workflows/:workflowId', workflowController.deleteWorkflow);

//Update a Workflow step
router.patch('/workflows/:workflowId/steps/:stepId', workflowController.updateWorkflowStep);

//update a step progress 
router.patch('/workflows/:workflowId/steps/:stepId/progress', workflowController.updateWorkflowStepProgress);

// Add comment to workflow step
router.post('/workflows/:workflowId/steps/:stepId/comments',workflowController.addWorkflowStepComment);

// TO update Action on the step by admin
router.patch(
  '/workflows/:workflowId/steps/:stepId/action-status',
  workflowController.updateStepActionStatus
);

module.exports = router;