const Workflow = require('../models/Workflow');
const Document = require('../models/Document');
const emailService = require('../services/emailService');

class WorkflowController {
  // Get all workflows for a document
  async getDocumentWorkflows(req, res) {
    try {
      const { documentId } = req.params;
      const userId = req.user.data.id;
      console.log("userId",userId);

      // Check if user has access to the document
      const document = await Document.findOne({
        _id: documentId,
        isDeleted: { $ne: true } // Exclude deleted documents
      });
      console.log("documents -->", document);
      console.log("documents -->", documentId);
      if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found or access denied' });
      }

      const isOwner = document.ownerId === userId || document.uploadedBy === userId;
      const userEmail = req.user.data.email; // Get email from user object
      const isShared = document.sharedWith.some(share => share.email === userEmail);
      console.log("isOwner", isOwner);
      console.log("isShared", isShared);
      
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
      const document = await Document.findOne({
        _id: documentId,
        isDeleted: { $ne: true } // Exclude deleted documents
      });
      if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found or access denied' });
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
      await WorkflowController.addWorkflowCollaborators(documentId, assigneeEmails, req.user.data.name || req.user.data.email, req.user.data.email);

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
            step.dueDate,
            req.user.data.email // Pass current user's email as sender
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
      const document = await Document.findOne({
        _id: workflow.documentId,
        isDeleted: { $ne: true } // Exclude deleted documents
      });
      if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found or access denied' });
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
  // async completeWorkflowStep(req, res) {
  //   try {
  //     const { workflowId, stepId } = req.params;
  //     const userId = req.user.data.id;
  //     const { status, comments } = req.body;

  //     const workflow = await Workflow.findById(workflowId);
  //     if (!workflow) {
  //       return res.status(404).json({ success: false, message: 'Workflow not found' });
  //     }

  //     // Check if user is assigned to this step
  //     const step = workflow.steps.id(stepId);
  //     if (!step) {
  //       return res.status(404).json({ success: false, message: 'Workflow step not found' });
  //     }

  //     if (step.assignee !== req.user.data.email) {
  //       return res.status(403).json({ success: false, message: 'You can only complete steps assigned to you' });
  //     }

  //     // Update step status
  //     step.status = status;
  //     if (status === 'completed') {
  //       step.completedAt = new Date();
  //       step.metadata.completedBy = req.user.data.email;
  //     }
  //     if (comments) {
  //       step.comments = comments;
  //     }

  //     // Check if all steps are completed
  //     const allStepsCompleted = workflow.steps.every(s => s.status === 'completed');
  //     if (allStepsCompleted) {
  //       workflow.status = 'completed';
  //       workflow.completedAt = new Date();
        
  //       // Send completion notification
  //       const document = await Document.findOne({
  //         _id: workflow.documentId,
  //         isDeleted: { $ne: true } // Exclude deleted documents
  //       });
  //       if (document) {
  //         await emailService.sendWorkflowCompletion(
  //           workflow.name,
  //           document.name,
  //           req.user.data.name || req.user.data.email,
  //           workflow.steps,
  //           req.user.data.email // Pass current user's email as sender
  //         );
  //       }
  //     }

  //     await workflow.save();

  //     res.json({ 
  //       success: true, 
  //       message: 'Workflow step updated successfully', 
  //       data: workflow 
  //     });
  //   } catch (error) {
  //     console.error('Error completing workflow step:', error);
  //     res.status(500).json({ success: false, message: 'Failed to complete workflow step' });
  //   }
  // }



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
      const document = await Document.findOne({
        _id: workflow.documentId,
        isDeleted: { $ne: true } // Exclude deleted documents
      });
      if (!document) {
        return res.status(404).json({ success: false, message: 'Document not found or access denied' });
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

  // get Workflow by ID
  async getWorkflow(req, res) {
  try {
    const { workflowId } = req.params;
    const userId = req.user.data.id;
    const userEmail = req.user.data.email;

    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }

    // Check if user has access to the document
    const document = await Document.findOne({
      _id: workflow.documentId,
      isDeleted: { $ne: true } // Exclude deleted documents
    });
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found or access denied' });
    }

    const isOwner = document.ownerId === userId || document.uploadedBy === userId;
    const isShared = document.sharedWith.some(share => 
      share.userId === userId || 
      share.email === userEmail || 
      share.userId === userEmail
    );
    
    if (!isOwner && !isShared) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: workflow });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch workflow' });
  }
  }

 // Update workflow step - Handle start/pause timer
  async updateWorkflowStep(req, res) {
    try {
      const { workflowId, stepId } = req.params;
      const userEmail = req.user.data.email;
      const { action } = req.body; 
      // action can be: 'start' or 'pause'

      // Find workflow
      const workflow = await Workflow.findById(workflowId);
      if (!workflow) {
        return res.status(404).json({ 
          success: false, 
          message: 'Workflow not found' 
        });
      }

      // Check if workflow is cancelled
      if (workflow.status === 'cancelled') {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot update a cancelled workflow' 
        });
      }

      // Find the specific step
      const step = workflow.steps.id(stepId);
      if (!step) {
        return res.status(404).json({ 
          success: false, 
          message: 'Workflow step not found' 
        });
      }

      // Verify user is assigned to this step
      if (step.assignee !== userEmail) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only update steps assigned to you' 
        });
      }

      // Check if step is already completed or rejected
      if (step.status === 'completed' || step.status === 'rejected') {
        return res.status(400).json({ 
          success: false, 
          message: `Cannot update a ${step.status} step` 
        });
      }

      const now = new Date();

      // Handle different actions
      switch (action) {
        case 'start':
          if (step.timeTracking.isTimerRunning) {
            return res.status(400).json({ 
              success: false, 
              message: 'Timer is already running' 
            });
          }

          // Start timer
          step.timeTracking.isTimerRunning = true;
          step.timeTracking.lastStartTime = now;
          step.status = 'in_progress';
          
          // Set startedAt if first time
          if (!step.metadata.startedAt) {
            step.metadata.startedAt = now;
          }
          break;

        case 'pause':
          if (!step.timeTracking.isTimerRunning) {
            return res.status(400).json({ 
              success: false, 
              message: 'Timer is not running' 
            });
          }

          // Calculate duration for this session
          const sessionDuration = Math.floor(
            (now - new Date(step.timeTracking.lastStartTime)) / 1000
          ); // in seconds

          // Add to total time
          step.timeTracking.totalTimeSpent += sessionDuration;

          // Save session record
          step.timeTracking.sessions.push({
            startedAt: step.timeTracking.lastStartTime,
            pausedAt: now,
            duration: sessionDuration
          });

          // Stop timer
          step.timeTracking.isTimerRunning = false;
          step.timeTracking.lastStartTime = null;
          step.status = 'in_progress'; // Remains in progress but paused
          break;

        default:
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid action. Use: start or pause' 
          });
      }

      await workflow.save();

      // Calculate current total time (including running session if active)
      let currentTotalTime = step.timeTracking.totalTimeSpent;
      if (step.timeTracking.isTimerRunning) {
        const currentSessionTime = Math.floor(
          (now - new Date(step.timeTracking.lastStartTime)) / 1000
        );
        currentTotalTime += currentSessionTime;
      }

      res.json({ 
        success: true, 
        message: `Workflow step ${action}ed successfully`, 
        data: {
          workflow,
          currentStep: step,
          totalTimeSpent: currentTotalTime, // Total time including current session
          totalTimeSpentFormatted: WorkflowController.formatTime(currentTotalTime),
          isTimerRunning: step.timeTracking.isTimerRunning,
          lastStartTime: step.timeTracking.lastStartTime
        }
      });

    } catch (error) {
      console.error('Error updating workflow step:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update workflow step' 
      });
    }
  }

  //NEW Complete workflow step - Handle complete/reject status
  async completeWorkflowStep(req, res) {
    try {
      const { workflowId, stepId } = req.params;
      const userEmail = req.user.data.email;
      const userName = req.user.data.name || userEmail;
      const { status, comments } = req.body; 
      // status can be: 'completed' or 'rejected'

      // Validate status
      if (!['completed', 'rejected'].includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Status must be either completed or rejected' 
        });
      }

      // Find workflow
      const workflow = await Workflow.findById(workflowId);
      if (!workflow) {
        return res.status(404).json({ 
          success: false, 
          message: 'Workflow not found' 
        });
      }

      // Check if workflow is cancelled
      if (workflow.status === 'cancelled') {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot complete a step in a cancelled workflow' 
        });
      }

      // Find the specific step
      const step = workflow.steps.id(stepId);
      if (!step) {
        return res.status(404).json({ 
          success: false, 
          message: 'Workflow step not found' 
        });
      }

      // Verify user is assigned to this step
      if (step.assignee !== userEmail) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only complete steps assigned to you' 
        });
      }

      // Check if step is already completed or rejected
      if (step.status === 'completed' || step.status === 'rejected') {
        return res.status(400).json({ 
          success: false, 
          message: `Step is already ${step.status}` 
        });
      }

      const now = new Date();

      // If timer is running, stop it and save final session
      if (step.timeTracking.isTimerRunning) {
        const sessionDuration = Math.floor(
          (now - new Date(step.timeTracking.lastStartTime)) / 1000
        );
        step.timeTracking.totalTimeSpent += sessionDuration;
        step.timeTracking.sessions.push({
          startedAt: step.timeTracking.lastStartTime,
          pausedAt: now,
          duration: sessionDuration
        });
        step.timeTracking.isTimerRunning = false;
        step.timeTracking.lastStartTime = null;
      }

      // Get document details for email
      const document = await Document.findOne({
        _id: workflow.documentId,
        isDeleted: { $ne: true }
      });

      // Handle based on status
      if (status === 'completed') {
        step.status = 'completed';
        step.completedAt = now;
        step.metadata.completedBy = userEmail;
        
        // Add comments if provided (optional for completion)
        if (comments) {
          step.comments = comments;
        }

        // Send step completion notification to workflow creator
        if (document && workflow.createdBy) {
          await emailService.sendStepCompletion(
            workflow.name,
            document.name,
            step.name,
            userName,
            'completed',
            comments || 'No comments provided',
            workflow.createdBy // Send to workflow creator
          );
        }

        // Check if all steps are completed
        const allStepsCompleted = workflow.steps.every(
          s => s.status === 'completed'
        );
        
        if (allStepsCompleted) {
          workflow.status = 'completed';
          workflow.completedAt = now;
          
          // Calculate total actual duration in hours
          const totalDuration = workflow.steps.reduce((sum, s) => 
            sum + (s.timeTracking.totalTimeSpent || 0), 0
          );
          workflow.metadata.actualDuration = totalDuration / 3600;
          
          // Send full workflow completion notification to creator
          if (document && workflow.createdBy) {
            await emailService.sendWorkflowCompletion(
              workflow.name,
              document.name,
              userName,
              workflow.steps,
              workflow.createdBy // Send to workflow creator
            );
          }
        }
      } else if (status === 'rejected') {
        // Rejection requires comments
        if (!comments) {
          return res.status(400).json({ 
            success: false, 
            message: 'Comments are required when rejecting a step' 
          });
        }

        step.status = 'rejected';
        step.comments = comments;
        step.metadata.rejectionReason = comments;

        // Send step rejection notification to workflow creator
        if (document && workflow.createdBy) {
          await emailService.sendStepCompletion(
            workflow.name,
            document.name,
            step.name,
            userName,
            'rejected',
            comments,
            workflow.createdBy // Send to workflow creator
          );
        }
      }

      await workflow.save();

      res.json({ 
        success: true, 
        message: `Workflow step ${status} successfully`, 
        data: {
          workflow,
          currentStep: step,
          timeSpent: step.timeTracking.totalTimeSpent,
          timeSpentFormatted: WorkflowController.formatTime(step.timeTracking.totalTimeSpent)
        }
      });

    } catch (error) {
      console.error('Error completing workflow step:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to complete workflow step' 
      });
    }
  }

  // Update the Step Progress bar
  async updateWorkflowStepProgress(req, res) {
  try {
    const { workflowId, stepId } = req.params;
    const userEmail = req.user.data.email;
    const { progressPercentage } = req.body;

    if (progressPercentage !== undefined) {
      if (typeof progressPercentage !== 'number' || progressPercentage < 0 || progressPercentage > 100) {
        return res.status(400).json({ 
          success: false, 
          message: 'Progress percentage must be a number between 0 and 100' 
        });
      }
    }

    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }

    if (workflow.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot update progress in a cancelled workflow' });
    }

    const step = workflow.steps.id(stepId);
    if (!step) {
      return res.status(404).json({ success: false, message: 'Workflow step not found' });
    }

    if (step.assignee !== userEmail) {
      return res.status(403).json({ success: false, message: 'You can only update progress for steps assigned to you' });
    }

    if (step.status === 'completed' || step.status === 'rejected') {
      return res.status(400).json({ success: false, message: `Cannot update progress for a ${step.status} step` });
    }

    // Update step progress percentage
    if (progressPercentage !== undefined) {
      step.progressPercentage = progressPercentage;
    }


    // Change status if needed
    if (step.status === 'pending' && progressPercentage > 0) {
      step.status = 'in_progress';
      if (!step.metadata.startedAt) {
        step.metadata.startedAt = new Date();
      }
    }

    await workflow.save();

    res.json({ 
      success: true, 
      message: 'Progress updated successfully', 
      data: {
        workflow,
        currentStep: step,
        progressPercentage: step.progressPercentage
      }
    });

  } catch (error) {
    console.error('Error updating workflow step progress:', error);
    res.status(500).json({ success: false, message: 'Failed to update progress' });
  }
  }

  // Add comment to workflow step - Only assignees can comment
  async addWorkflowStepComment(req, res) {
    try {
      const { workflowId, stepId } = req.params;
      const userEmail = req.user.data.email;
      const userName = req.user.data.name || userEmail;
      const { comment } = req.body;

      // Validate comment
      if (!comment || !comment.trim()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Comment cannot be empty' 
        });
      }

      // Find workflow
      const workflow = await Workflow.findById(workflowId);
      if (!workflow) {
        return res.status(404).json({ 
          success: false, 
          message: 'Workflow not found' 
        });
      }

      // Check if workflow is cancelled
      if (workflow.status === 'cancelled') {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot add comments to a cancelled workflow' 
        });
      }

      // Find the specific step
      const step = workflow.steps.id(stepId);
      if (!step) {
        return res.status(404).json({ 
          success: false, 
          message: 'Workflow step not found' 
        });
      }

      // Check if user is the assignee of this step
      if (step.assignee !== userEmail) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only add comments to steps assigned to you' 
        });
      }

      // // Create formatted comment with timestamp and user info
      // const timestamp = new Date().toISOString();
      // const formattedComment = `[${timestamp}] ${userName}: ${comment.trim()}`;

      // Create formatted comment with readable timestamp and user info
        const date = new Date();

        // Helper to get ordinal suffix (st, nd, rd, th)
        const getOrdinalSuffix = (n) => {
          if (n > 3 && n < 21) return 'th';
          switch (n % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
          }
        };

        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        const time = date.toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

        const formattedDate = `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
        const formattedComment = ` ${userName} [${time}, ${formattedDate}] : ${comment.trim()}`;

        console.log(formattedComment);


      // Add comment to step
      step.comments.push(formattedComment);

      await workflow.save();

      res.json({ 
        success: true, 
        message: 'Comment added successfully', 
        data: {
          workflow,
          currentStep: step,
          newComment: formattedComment
        }
      });

    } catch (error) {
      console.error('Error adding workflow step comment:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to add comment' 
      });
    }
  }

  // Update workflow step action status (approve/reject/drop)
  // ONLY the workflow creator (createdBy) can use these actions
  // async updateStepActionStatus(req, res) {
  //   try {
  //     const { workflowId, stepId } = req.params;
  //     const userEmail = req.user.data.email;
  //     const userName = req.user.data.name || userEmail;
  //     const { actionStatus, comments } = req.body; 
  //     // actionStatus can be: 'approved', 'rejected', 'dropped'

  //     // Validate action status
  //     const validStatuses = ['approved', 'rejected', 'dropped'];
  //     if (!actionStatus || !validStatuses.includes(actionStatus)) {
  //       return res.status(400).json({ 
  //         success: false, 
  //         message: 'Invalid action status. Must be approved, rejected, or dropped' 
  //       });
  //     }

  //     // Find workflow
  //     const workflow = await Workflow.findById(workflowId);
  //     if (!workflow) {
  //       return res.status(404).json({ 
  //         success: false, 
  //         message: 'Workflow not found' 
  //       });
  //     }

  //     // Check if workflow is cancelled
  //     if (workflow.status === 'cancelled') {
  //       return res.status(400).json({ 
  //         success: false, 
  //         message: 'Cannot update action status in a cancelled workflow' 
  //       });
  //     }

  //     // AUTHORIZATION CHECK: Only workflow creator can approve/reject/drop steps
  //     if (workflow.createdBy !== userEmail) {
  //       return res.status(403).json({ 
  //         success: false, 
  //         message: 'Only the workflow creator can approve, reject, or drop steps' 
  //       });
  //     }

  //     // Find the specific step
  //     const step = workflow.steps.id(stepId);
  //     if (!step) {
  //       return res.status(404).json({ 
  //         success: false, 
  //         message: 'Workflow step not found' 
  //       });
  //     }

  //     // Check if step is already completed or rejected
  //     if (step.status === 'completed' || step.status === 'rejected') {
  //       return res.status(400).json({ 
  //         success: false, 
  //         message: `Cannot update action status of a ${step.status} step` 
  //       });
  //     }

  //     const now = new Date();

  //     // If timer is running, stop it and save final session
  //     if (step.timeTracking.isTimerRunning) {
  //       const sessionDuration = Math.floor(
  //         (now - new Date(step.timeTracking.lastStartTime)) / 1000
  //       );
  //       step.timeTracking.totalTimeSpent += sessionDuration;
  //       step.timeTracking.sessions.push({
  //         startedAt: step.timeTracking.lastStartTime,
  //         pausedAt: now,
  //         duration: sessionDuration
  //       });
  //       step.timeTracking.isTimerRunning = false;
  //       step.timeTracking.lastStartTime = null;
  //     }

  //     // Get document details for email
  //     const document = await Document.findOne({
  //       _id: workflow.documentId,
  //       isDeleted: { $ne: true }
  //     });

  //     // Get assignee name for notifications
  //     const assigneeName = step.assignee;

  //     // Handle based on action status
  //     if (actionStatus === 'approved') {
  //       step.actionStatus = 'approved';
  //       step.status = 'completed';
  //       step.progressPercentage = 100;
  //       step.completedAt = now;
  //       step.metadata.completedBy = userEmail;
        
  //       // Add approval comment
  //       const approvalComment = comments?.trim() || 'Step approved and completed';
  //       step.comments.push(`[APPROVED] ${approvalComment}`);

  //       // Send step approval notification to assignee
  //       if (document && step.assignee) {
  //         await emailService.sendStepCompletion(
  //           workflow.name,
  //           document.name,
  //           step.name,
  //           userName,
  //           'approved',
  //           approvalComment,
  //           step.assignee
  //         );
  //       }

  //       // Check if all steps are completed
  //       const allStepsCompleted = workflow.steps.every(
  //         s => s.status === 'completed'
  //       );
        
  //       if (allStepsCompleted) {
  //         workflow.status = 'completed';
  //         workflow.completedAt = now;
          
  //         // Calculate total actual duration in hours
  //         const totalDuration = workflow.steps.reduce((sum, s) => 
  //           sum + (s.timeTracking.totalTimeSpent || 0), 0
  //         );
  //         workflow.metadata.actualDuration = totalDuration / 3600;
          
  //         // Send full workflow completion notification to all assignees
  //         if (document) {
  //           const uniqueAssignees = [...new Set(workflow.steps.map(s => s.assignee))];
  //           for (const assignee of uniqueAssignees) {
  //             await emailService.sendWorkflowCompletion(
  //               workflow.name,
  //               document.name,
  //               userName,
  //               workflow.steps,
  //               assignee
  //             );
  //           }
  //         }
  //       }
  //     } 
  //     else if (actionStatus === 'rejected') {
  //       // Rejection requires comments
  //       if (!comments || !comments.trim()) {
  //         return res.status(400).json({ 
  //           success: false, 
  //           message: 'Comments are required when rejecting a step' 
  //         });
  //       }

  //       step.actionStatus = 'rejected';
  //       step.status = 'rejected';
  //       step.completedAt = now;
  //       step.metadata.completedBy = userEmail;
  //       step.metadata.rejectionReason = comments.trim();
        
  //       // Add rejection comment
  //       step.comments.push(`[REJECTED] ${comments.trim()}`);

  //       // Send step rejection notification to assignee
  //       if (document && step.assignee) {
  //         await emailService.sendStepCompletion(
  //           workflow.name,
  //           document.name,
  //           step.name,
  //           userName,
  //           'rejected',
  //           comments.trim(),
  //           step.assignee
  //         );
  //       }
  //     } 
  //     else if (actionStatus === 'dropped') {
  //       // Drop requires comments
  //       if (!comments || !comments.trim()) {
  //         return res.status(400).json({ 
  //           success: false, 
  //           message: 'Comments are required when dropping a step' 
  //         });
  //       }

  //       step.actionStatus = 'dropped';
  //       step.status = 'rejected'; // Dropped steps marked as rejected
  //       step.completedAt = now;
  //       step.metadata.completedBy = userEmail;
  //       step.metadata.rejectionReason = comments.trim();
        
  //       // Add drop comment
  //       step.comments.push(`[DROPPED] ${comments.trim()}`);

  //       // Send step drop notification to assignee
  //       if (document && step.assignee) {
  //         await emailService.sendStepCompletion(
  //           workflow.name,
  //           document.name,
  //           step.name,
  //           userName,
  //           'dropped',
  //           comments.trim(),
  //           step.assignee
  //         );
  //       }
  //     }

  //     await workflow.save();

  //     res.json({ 
  //       success: true, 
  //       message: `Workflow step ${actionStatus} successfully`, 
  //       data: {
  //         workflow,
  //         currentStep: step,
  //         actionStatus: step.actionStatus,
  //         timeSpent: step.timeTracking.totalTimeSpent,
  //         timeSpentFormatted: WorkflowController.formatTime(step.timeTracking.totalTimeSpent)
  //       }
  //     });

  //   } catch (error) {
  //     console.error('Error updating step action status:', error);
  //     res.status(500).json({ 
  //       success: false, 
  //       message: 'Failed to update action status' 
  //     });
  //   }
  // }

  // Update workflow step action status (approve/reject/drop)
// ONLY the workflow creator (createdBy) can use these actions
  // async updateStepActionStatus(req, res) {
  //   try {
  //     const { workflowId, stepId } = req.params;
  //     console.log("backend workflow",workflowId);
  //     console.log("step id backend",stepId);
  //     const userEmail = req.user.data.email;
  //     const userName = req.user.data.name || userEmail;
  //     const { actionStatus, comments } = req.body; 
  //     // actionStatus can be: 'approved', 'rejected', 'dropped'

  //     // Validate action status
  //     const validStatuses = ['approved', 'rejected', 'dropped'];
  //     if (!actionStatus || !validStatuses.includes(actionStatus)) {
  //       return res.status(400).json({ 
  //         success: false, 
  //         message: 'Invalid action status. Must be approved, rejected, or dropped' 
  //       });
  //     }

  //     // Find workflow
  //     const workflow = await Workflow.findById(workflowId);
  //     if (!workflow) {
  //       return res.status(404).json({ 
  //         success: false, 
  //         message: 'Workflow not found' 
  //       });
  //     }

  //     // Check if workflow is cancelled
  //     if (workflow.status === 'cancelled') {
  //       return res.status(400).json({ 
  //         success: false, 
  //         message: 'Cannot update action status in a cancelled workflow' 
  //       });
  //     }

  //     // AUTHORIZATION CHECK: Only workflow creator can approve/reject/drop steps
  //     // if (workflow.createdBy !== userEmail) {
  //     //   return res.status(403).json({ 
  //     //     success: false, 
  //     //     message: 'Only the workflow creator can approve, reject, or drop steps' 
  //     //   });
  //     // }

  //     // Find the specific step
  //     const step = workflow.steps.id(stepId);
  //     if (!step) {
  //       return res.status(404).json({ 
  //         success: false, 
  //         message: 'Workflow step not found' 
  //       });
  //     }

  //     // Check if step is already completed or rejected
  //     if (step.status === 'completed' || step.status === 'rejected') {
  //       return res.status(400).json({ 
  //         success: false, 
  //         message: `Cannot update action status of a ${step.status} step` 
  //       });
  //     }

  //     const now = new Date();

  //     // If timer is running, stop it and save final session
  //     if (step.timeTracking.isTimerRunning) {
  //       const sessionDuration = Math.floor(
  //         (now - new Date(step.timeTracking.lastStartTime)) / 1000
  //       );
  //       step.timeTracking.totalTimeSpent += sessionDuration;
  //       step.timeTracking.sessions.push({
  //         startedAt: step.timeTracking.lastStartTime,
  //         pausedAt: now,
  //         duration: sessionDuration
  //       });
  //       step.timeTracking.isTimerRunning = false;
  //       step.timeTracking.lastStartTime = null;
  //     }

  //     // Get document details for email
  //     const document = await Document.findOne({
  //       _id: workflow.documentId,
  //       isDeleted: { $ne: true }
  //     });

  //     // Get assignee name for notifications
  //     const assigneeName = step.assignee;

  //     // Handle based on action status
  //     if (actionStatus === 'approved') {
  //       step.actionStatus = 'approved';
  //       step.status = 'completed';
  //       step.progressPercentage = 100;
  //       step.completedAt = now;
  //       step.metadata.completedBy = userEmail;
        
  //       // Add approval comment
  //       const approvalComment = comments?.trim() || 'Step approved and completed by workflow creator';
  //       step.comments.push(`[APPROVED] ${approvalComment}`);

  //       // Send step approval notification to assignee
  //       if (document && step.assignee) {
  //         await emailService.sendStepCompletion(
  //           workflow.name,
  //           document.name,
  //           step.name,
  //           userName,
  //           'approved',
  //           approvalComment,
  //           step.assignee
  //         );
  //       }

  //       // Check if all steps are completed
  //       const allStepsCompleted = workflow.steps.every(
  //         s => s.status === 'completed'
  //       );
        
  //       if (allStepsCompleted) {
  //         workflow.status = 'completed';
  //         workflow.completedAt = now;
          
  //         // Calculate total actual duration in hours
  //         const totalDuration = workflow.steps.reduce((sum, s) => 
  //           sum + (s.timeTracking.totalTimeSpent || 0), 0
  //         );
  //         workflow.metadata.actualDuration = totalDuration / 3600;
          
  //         // Send full workflow completion notification to all assignees
  //         if (document) {
  //           const uniqueAssignees = [...new Set(workflow.steps.map(s => s.assignee))];
  //           for (const assignee of uniqueAssignees) {
  //             await emailService.sendWorkflowCompletion(
  //               workflow.name,
  //               document.name,
  //               userName,
  //               workflow.steps,
  //               assignee
  //             );
  //           }
  //         }
  //       }
  //     } 
  //     else if (actionStatus === 'rejected') {
  //       // Comments are optional for rejection
  //       step.actionStatus = 'rejected';
  //       step.status = 'rejected';
  //       step.completedAt = now;
  //       step.metadata.completedBy = userEmail;
        
  //       // Add rejection comment only if provided
  //       if (comments && comments.trim()) {
  //         step.metadata.rejectionReason = comments.trim();
  //         step.comments.push(`[REJECTED] ${comments.trim()}`);
  //       } else {
  //         step.metadata.rejectionReason = 'No reason provided';
  //         step.comments.push(`[REJECTED] Step rejected by workflow creator`);
  //       }

  //       // Send step rejection notification to assignee
  //       if (document && step.assignee) {
  //         await emailService.sendStepCompletion(
  //           workflow.name,
  //           document.name,
  //           step.name,
  //           userName,
  //           'rejected',
  //           step.metadata.rejectionReason,
  //           step.assignee
  //         );
  //       }
  //     } 
  //     else if (actionStatus === 'dropped') {
  //       // Comments are optional for drop
  //       step.actionStatus = 'dropped';
  //       step.status = 'rejected'; // Dropped steps marked as rejected
  //       step.completedAt = now;
  //       step.metadata.completedBy = userEmail;
        
  //       // Add drop comment only if provided
  //       if (comments && comments.trim()) {
  //         step.metadata.rejectionReason = comments.trim();
  //         step.comments.push(`[DROPPED] ${comments.trim()}`);
  //       } else {
  //         step.metadata.rejectionReason = 'No reason provided';
  //         step.comments.push(`[DROPPED] Step dropped by workflow creator`);
  //       }

  //       // Send step drop notification to assignee
  //       if (document && step.assignee) {
  //         await emailService.sendStepCompletion(
  //           workflow.name,
  //           document.name,
  //           step.name,
  //           userName,
  //           'dropped',
  //           step.metadata.rejectionReason,
  //           step.assignee
  //         );
  //       }
  //     }

  //     await workflow.save();

  //     res.json({ 
  //       success: true, 
  //       message: `Workflow step ${actionStatus} successfully`, 
  //       data: {
  //         workflow,
  //         currentStep: step,
  //         actionStatus: step.actionStatus,
  //         timeSpent: step.timeTracking.totalTimeSpent,
  //         timeSpentFormatted: WorkflowController.formatTime(step.timeTracking.totalTimeSpent)
  //       }
  //     });

  //   } catch (error) {
  //     console.error('Error updating step action status:', error);
  //     res.status(500).json({ 
  //       success: false, 
  //       message: 'Failed to update action status' 
  //     });
  //   }
  // }

  async updateStepActionStatus(req, res) {
  try {
    const { workflowId, stepId } = req.params;
    console.log('🔹 Backend: updateStepActionStatus called');
    console.log('Workflow ID:', workflowId);
    console.log('Step ID:', stepId);

    const userEmail = req.user.data.email;
    const userName = req.user.data.name || userEmail;
    console.log('User email:', userEmail, 'User name:', userName);

    const { actionStatus, comments } = req.body;
    console.log('Action status from request:', actionStatus);
    console.log('Comments from request:', comments);

    // Validate action status
    const validStatuses = ['approved', 'rejected', 'dropped'];
    if (!actionStatus || !validStatuses.includes(actionStatus)) {
      console.log('❌ Invalid action status:', actionStatus);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid action status. Must be approved, rejected, or dropped' 
      });
    }

    // Find workflow
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      console.log('❌ Workflow not found for ID:', workflowId);
      return res.status(404).json({ 
        success: false, 
        message: 'Workflow not found' 
      });
    }
    console.log('Workflow found:', workflow.name, 'Status:', workflow.status);

    // // Check if workflow is cancelled
    // if (workflow.status === 'cancelled') {
    //   console.log('❌ Workflow is cancelled, cannot update step');
    //   return res.status(400).json({ 
    //     success: false, 
    //     message: 'Cannot update action status in a cancelled workflow' 
    //   });
    // }

    // AUTHORIZATION CHECK (commented out)
    // if (workflow.createdBy !== userEmail) {
    //   console.log('❌ Unauthorized user:', userEmail);
    //   return res.status(403).json({ 
    //     success: false, 
    //     message: 'Only the workflow creator can approve, reject, or drop steps' 
    //   });
    // }

    // Find the specific step
    const step = workflow.steps.id(stepId);
    if (!step) {
      console.log('❌ Step not found in workflow for stepId:', stepId);
      return res.status(404).json({ 
        success: false, 
        message: 'Workflow step not found' 
      });
    }
    console.log('Step found:', step.name, 'Current status:', step.status);

    // // Check if step is already completed or rejected
    // if (step.status === 'completed' || step.status === 'rejected') {
    //   console.log('❌ Step already completed or rejected:', step.status);
    //   return res.status(400).json({ 
    //     success: false, 
    //     message: `Cannot update action status of a ${step.status} step` 
    //   });
    // }

    const now = new Date();

    // Timer handling
    if (step.timeTracking.isTimerRunning) {
      console.log('Timer running, stopping timer for step');
      const sessionDuration = Math.floor(
        (now - new Date(step.timeTracking.lastStartTime)) / 1000
      );
      step.timeTracking.totalTimeSpent += sessionDuration;
      step.timeTracking.sessions.push({
        startedAt: step.timeTracking.lastStartTime,
        pausedAt: now,
        duration: sessionDuration
      });
      step.timeTracking.isTimerRunning = false;
      step.timeTracking.lastStartTime = null;
    }

    // Get document details
    const document = await Document.findOne({
      _id: workflow.documentId,
      isDeleted: { $ne: true }
    });
    console.log('Associated document:', document?.name);

    // Handle action
    console.log(`Processing action: ${actionStatus} for step: ${step.name}`);
    
    if (actionStatus === 'approved') {
      step.actionStatus = 'approved';
      step.status = 'completed';
      step.progressPercentage = 100;
      step.completedAt = now;
      step.metadata.completedBy = userEmail;
      const approvalComment = comments?.trim() || 'Step approved and completed by workflow creator';
      step.comments.push(`[APPROVED] ${approvalComment}`);
      console.log('Step approved with comment:', approvalComment);
    } else if (actionStatus === 'rejected') {
      step.actionStatus = 'rejected';
      step.status = 'rejected';
      step.completedAt = now;
      step.metadata.completedBy = userEmail;
      if (comments && comments.trim()) {
        step.metadata.rejectionReason = comments.trim();
        step.comments.push(`[REJECTED] ${comments.trim()}`);
      } else {
        step.metadata.rejectionReason = 'No reason provided';
        step.comments.push(`[REJECTED] Step rejected by workflow creator`);
      }
      console.log('Step rejected with comment:', step.metadata.rejectionReason);
    } else if (actionStatus === 'dropped') {
      step.actionStatus = 'dropped';
      step.status = 'rejected';
      step.completedAt = now;
      step.metadata.completedBy = userEmail;
      if (comments && comments.trim()) {
        step.metadata.rejectionReason = comments.trim();
        step.comments.push(`[DROPPED] ${comments.trim()}`);
      } else {
        step.metadata.rejectionReason = 'No reason provided';
        step.comments.push(`[DROPPED] Step dropped by workflow creator`);
      }
      console.log('Step dropped with comment:', step.metadata.rejectionReason);
    }

    // Save workflow
    await workflow.save();
    console.log('Workflow saved successfully');

    res.json({ 
      success: true, 
      message: `Workflow step ${actionStatus} successfully`, 
      data: {
        workflow,
        currentStep: step,
        actionStatus: step.actionStatus,
        timeSpent: step.timeTracking.totalTimeSpent,
        timeSpentFormatted: WorkflowController.formatTime(step.timeTracking.totalTimeSpent)
      }
    });

  } catch (error) {
    console.error('❌ Error updating step action status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update action status' 
    });
  }
}

  // Helper method to add workflow collaborators
  static async addWorkflowCollaborators(documentId, assigneeEmails, inviterName, senderEmail) {
    try {
      console.log(`🔍 Adding workflow collaborators for document ${documentId}`);
      console.log(`🔍 Assignee emails:`, assigneeEmails);
      
      const document = await Document.findOne({
        _id: documentId,
        isDeleted: { $ne: true } // Exclude deleted documents
      });
      if (!document) {
        console.log(`❌ Document not found or access denied: ${documentId}`);
        return;
      }

      console.log(`🔍 Current document sharedWith:`, document.sharedWith);
      
      // Check if document.sharedWith exists, if not initialize it
      if (!document.sharedWith) {
        document.sharedWith = [];
        console.log(`🔍 Initialized empty sharedWith array`);
      }


      // Check for existing collaborators by both userId and email
      const existingCollaborators = document.sharedWith.map(share => share.userId || share.email).filter(Boolean);
      console.log(`🔍 Existing collaborators:`, existingCollaborators);
      
      const newCollaborators = assigneeEmails.filter(email => !existingCollaborators.includes(email));
      console.log(`🔍 New collaborators to add:`, newCollaborators);

      if (newCollaborators.length === 0) {
        console.log(`ℹ️ All assignees are already collaborators for this document`);
        return;
      }

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
            ['edit', 'comment'],
            senderEmail // Pass current user's email as sender
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

  // Helper function to format time in seconds to readable format
  static formatTime(seconds) {
    if (!seconds || seconds === 0) {
      return '0s';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    if (minutes > 0) {
      parts.push(`${minutes}m`);
    }
    if (secs > 0 || parts.length === 0) {
      parts.push(`${secs}s`);
    }

    return parts.join(' ');
  }
}


module.exports = new WorkflowController();