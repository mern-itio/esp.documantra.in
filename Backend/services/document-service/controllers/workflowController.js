const Workflow = require('../models/Workflow');
const Document = require('../models/Document');
const emailService = require('../services/emailService');

class WorkflowController {
  // Get all workflows for a document
  async getDocumentWorkflows(req, res) {
    try {
      const { documentId } = req.params;
      const userId = req.user.data.id;

      // Check if user has access to the document
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      const isOwner = document.ownerId === userId || document.uploadedBy === userId;
      const isShared = document.sharedWith.some(share => share.userId === userId);
      
      if (!isOwner && !isShared) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const workflows = await Workflow.find({ documentId })
        .sort({ createdAt: -1 })
        .lean();

      res.json({ success: true, data: workflows });
    } catch (error) {
      console.error('Error fetching document workflows:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch workflows' });
    }
  }

  // Create a new workflow
  async createWorkflow(req, res) {
    try {
      const { documentId } = req.params;
      const userId = req.user.data.id;
      const { name, priority, deadline, steps, metadata } = req.body;

      // Check if user has access to the document
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      const isOwner = document.ownerId === userId || document.uploadedBy === userId;
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Only document owners can create workflows' });
      }

      // Create workflow
      const workflow = new Workflow({
        name,
        documentId,
        priority: priority || 'medium',
        deadline: deadline || undefined,
        steps: steps.map(step => ({
          ...step,
          status: 'pending',
          currentApprovals: 0
        })),
        createdBy: req.user.data.email,
        createdByName: req.user.data.name || req.user.data.email,
        metadata: metadata || {}
      });

      await workflow.save();

      // Add workflow assignees as collaborators
      const assigneeEmails = steps.map(step => step.assignee);
      console.log(`🔍 Workflow creation: Adding collaborators for assignees:`, assigneeEmails);
      await WorkflowController.addWorkflowCollaborators(documentId, assigneeEmails, req.user.data.name || req.user.data.email);

      // Send email notifications to assignees
      for (const step of steps) {
        try {
          await emailService.sendWorkflowAssignment(
            step.assignee,
            step.assigneeName,
            name,
            document.name,
            documentId,
            step.name,
            step.dueDate
          );
        } catch (error) {
          console.log(`⚠️ Email notification failed for ${step.assignee}:`, error.message);
          // Continue with other steps even if email fails
        }
      }

      res.status(201).json({ 
        success: true, 
        message: 'Workflow created successfully', 
        data: workflow 
      });
    } catch (error) {
      console.error('Error creating workflow:', error);
      res.status(500).json({ success: false, message: 'Failed to create workflow' });
    }
  }

  // Update workflow
  async updateWorkflow(req, res) {
    try {
      const { workflowId } = req.params;
      const userId = req.user.data.id;
      const updates = req.body;

      const workflow = await Workflow.findById(workflowId);
      if (!workflow) {
        return res.status(404).json({ success: false, message: 'Workflow not found' });
      }

      // Check if user has access to the document
      const document = await Document.findById(workflow.documentId);
      if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      const isOwner = document.ownerId === userId || document.uploadedBy === userId;
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Only document owners can update workflows' });
      }

      // Update workflow
      const updatedWorkflow = await Workflow.findByIdAndUpdate(
        workflowId,
        { $set: updates },
        { new: true, runValidators: true }
      );

      res.json({ 
        success: true, 
        message: 'Workflow updated successfully', 
        data: updatedWorkflow 
      });
    } catch (error) {
      console.error('Error updating workflow:', error);
      res.status(500).json({ success: false, message: 'Failed to update workflow' });
    }
  }

  // Complete a workflow step
  async completeWorkflowStep(req, res) {
    try {
      const { workflowId, stepId } = req.params;
      const userId = req.user.data.id;
      const { status, comments } = req.body;

      const workflow = await Workflow.findById(workflowId);
      if (!workflow) {
        return res.status(404).json({ success: false, message: 'Workflow not found' });
      }

      // Check if user is assigned to this step
      const step = workflow.steps.id(stepId);
      if (!step) {
        return res.status(404).json({ success: false, message: 'Workflow step not found' });
      }

      if (step.assignee !== req.user.data.email) {
        return res.status(403).json({ success: false, message: 'You can only complete steps assigned to you' });
      }

      // Update step status
      step.status = status;
      if (status === 'completed') {
        step.completedAt = new Date();
        step.metadata.completedBy = req.user.data.email;
      }
      if (comments) {
        step.comments = comments;
      }

      // Check if all steps are completed
      const allStepsCompleted = workflow.steps.every(s => s.status === 'completed');
      if (allStepsCompleted) {
        workflow.status = 'completed';
        workflow.completedAt = new Date();
        
        // Send completion notification
        const document = await Document.findById(workflow.documentId);
        if (document) {
          await emailService.sendWorkflowCompletion(
            workflow.name,
            document.name,
            req.user.data.name || req.user.data.email,
            workflow.steps
          );
        }
      }

      await workflow.save();

      res.json({ 
        success: true, 
        message: 'Workflow step updated successfully', 
        data: workflow 
      });
    } catch (error) {
      console.error('Error completing workflow step:', error);
      res.status(500).json({ success: false, message: 'Failed to complete workflow step' });
    }
  }

  // Delete workflow
  async deleteWorkflow(req, res) {
    try {
      const { workflowId } = req.params;
      const userId = req.user.data.id;

      const workflow = await Workflow.findById(workflowId);
      if (!workflow) {
        return res.status(404).json({ success: false, message: 'Workflow not found' });
      }

      // Check if user has access to the document
      const document = await Document.findById(workflow.documentId);
      if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      const isOwner = document.ownerId === userId || document.uploadedBy === userId;
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Only document owners can delete workflows' });
      }

      await Workflow.findByIdAndDelete(workflowId);

      res.json({ 
        success: true, 
        message: 'Workflow deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting workflow:', error);
      res.status(500).json({ success: false, message: 'Failed to delete workflow' });
    }
  }

  // Get workflow by ID
  async getWorkflow(req, res) {
    try {
      const { workflowId } = req.params;
      const userId = req.user.data.id;

      const workflow = await Workflow.findById(workflowId);
      if (!workflow) {
        return res.status(404).json({ success: false, message: 'Workflow not found' });
      }

      // Check if user has access to the document
      const document = await Document.findById(workflow.documentId);
      if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      const isOwner = document.ownerId === userId || document.uploadedBy === userId;
      const isShared = document.sharedWith.some(share => share.userId === userId);
      
      if (!isOwner && !isShared) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      res.json({ success: true, data: workflow });
    } catch (error) {
      console.error('Error fetching workflow:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch workflow' });
    }
  }

  // Helper method to add workflow collaborators
  static async addWorkflowCollaborators(documentId, assigneeEmails, inviterName) {
    try {
      console.log(`🔍 Adding workflow collaborators for document ${documentId}`);
      console.log(`🔍 Assignee emails:`, assigneeEmails);
      
      const document = await Document.findById(documentId);
      if (!document) {
        console.log(`❌ Document not found: ${documentId}`);
        return;
      }

      console.log(`🔍 Current document sharedWith:`, document.sharedWith);
      
      // Check if document.sharedWith exists, if not initialize it
      if (!document.sharedWith) {
        document.sharedWith = [];
        console.log(`🔍 Initialized empty sharedWith array`);
      }

      const existingCollaborators = document.sharedWith.map(share => share.userId || share.email);
      console.log(`🔍 Existing collaborators:`, existingCollaborators);
      
      const newCollaborators = assigneeEmails.filter(email => !existingCollaborators.includes(email));
      console.log(`🔍 New collaborators to add:`, newCollaborators);

      for (const email of newCollaborators) {
        // Add to document's sharedWith array
        document.sharedWith.push({
          userId: email,
          email: email,
          permission: 'edit',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          createdAt: new Date()
        });

        console.log(`✅ Added collaborator: ${email}`);

        // Send collaborator invitation email
        try {
          await emailService.sendCollaboratorInvitation(
            email,
            document.name,
            documentId,
            inviterName,
            ['edit', 'comment']
          );
        } catch (error) {
          console.log(`⚠️ Collaborator invitation email failed for ${email}:`, error.message);
          // Continue even if email fails
        }
      }

      await document.save();
      console.log(`✅ Added ${newCollaborators.length} new collaborators to document ${documentId}`);
    } catch (error) {
      console.error('Error adding workflow collaborators:', error);
    }
  }
}

module.exports = new WorkflowController();
