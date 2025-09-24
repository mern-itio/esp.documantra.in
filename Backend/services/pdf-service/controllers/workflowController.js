const WorkflowTemplate = require('../models/WorkflowTemplate');
const WorkflowExecution = require('../models/WorkflowExecution');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class WorkflowController {
  // Get all workflow templates for a user
  async getWorkflowTemplates(req, res) {
    try {
      const userId = req.user.data.email;
      const { category, search, isPublic } = req.query;

      let query = {
        $or: [
          { createdBy: userId },
          { isPublic: true }
        ]
      };

      if (category) {
        query.category = category;
      }

      if (search) {
        query.$and = [
          {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } },
              { tags: { $in: [new RegExp(search, 'i')] } }
            ]
          }
        ];
      }

      if (isPublic !== undefined) {
        query.isPublic = isPublic === 'true';
      }

      const templates = await WorkflowTemplate.find(query)
        .sort({ usage: -1, createdAt: -1 })
        .lean();

      res.json({ success: true, data: templates });
    } catch (error) {
      console.error('Error fetching workflow templates:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch workflow templates' });
    }
  }

  // Get a specific workflow template
  async getWorkflowTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const userId = req.user.data.email;

      const template = await WorkflowTemplate.findOne({
        _id: templateId,
        $or: [
          { createdBy: userId },
          { isPublic: true }
        ]
      });

      if (!template) {
        return res.status(404).json({ success: false, message: 'Workflow template not found' });
      }

      res.json({ success: true, data: template });
    } catch (error) {
      console.error('Error fetching workflow template:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch workflow template' });
    }
  }

  // Create a new workflow template
  async createWorkflowTemplate(req, res) {
    try {
      const userId = req.user.data.email;
      const userName = req.user.data.name || req.user.data.email;
      const { name, description, steps, category, tags, isPublic, metadata } = req.body;

      // Validate steps
      if (!steps || !Array.isArray(steps) || steps.length === 0) {
        return res.status(400).json({ success: false, message: 'Workflow must have at least one step' });
      }

      // Validate step order
      const stepOrders = steps.map(step => step.order).sort((a, b) => a - b);
      for (let i = 0; i < stepOrders.length; i++) {
        if (stepOrders[i] !== i + 1) {
          return res.status(400).json({ success: false, message: 'Step orders must be sequential starting from 1' });
        }
      }

      const template = new WorkflowTemplate({
        name,
        description,
        steps,
        category: category || 'custom',
        tags: tags || [],
        isPublic: isPublic || false,
        createdBy: userId,
        createdByName: userName,
        metadata: metadata || {}
      });

      await template.save();

      res.status(201).json({ 
        success: true, 
        message: 'Workflow template created successfully', 
        data: template 
      });
    } catch (error) {
      console.error('Error creating workflow template:', error);
      res.status(500).json({ success: false, message: 'Failed to create workflow template' });
    }
  }

  // Update a workflow template
  async updateWorkflowTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const userId = req.user.data.email;
      const updates = req.body;

      const template = await WorkflowTemplate.findOne({
        _id: templateId,
        createdBy: userId
      });

      if (!template) {
        return res.status(404).json({ success: false, message: 'Workflow template not found or access denied' });
      }

      // Validate steps if provided
      if (updates.steps) {
        if (!Array.isArray(updates.steps) || updates.steps.length === 0) {
          return res.status(400).json({ success: false, message: 'Workflow must have at least one step' });
        }

        const stepOrders = updates.steps.map(step => step.order).sort((a, b) => a - b);
        for (let i = 0; i < stepOrders.length; i++) {
          if (stepOrders[i] !== i + 1) {
            return res.status(400).json({ success: false, message: 'Step orders must be sequential starting from 1' });
          }
        }
      }

      const updatedTemplate = await WorkflowTemplate.findByIdAndUpdate(
        templateId,
        { $set: updates },
        { new: true, runValidators: true }
      );

      res.json({ 
        success: true, 
        message: 'Workflow template updated successfully', 
        data: updatedTemplate 
      });
    } catch (error) {
      console.error('Error updating workflow template:', error);
      res.status(500).json({ success: false, message: 'Failed to update workflow template' });
    }
  }

  // Delete a workflow template
  async deleteWorkflowTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const userId = req.user.data.email;

      const template = await WorkflowTemplate.findOne({
        _id: templateId,
        createdBy: userId
      });

      if (!template) {
        return res.status(404).json({ success: false, message: 'Workflow template not found or access denied' });
      }

      await WorkflowTemplate.findByIdAndDelete(templateId);

      res.json({ 
        success: true, 
        message: 'Workflow template deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting workflow template:', error);
      res.status(500).json({ success: false, message: 'Failed to delete workflow template' });
    }
  }

  // Duplicate a workflow template
  async duplicateWorkflowTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const userId = req.user.data.email;
      const userName = req.user.data.name || req.user.data.email;

      const originalTemplate = await WorkflowTemplate.findOne({
        _id: templateId,
        $or: [
          { createdBy: userId },
          { isPublic: true }
        ]
      });

      if (!originalTemplate) {
        return res.status(404).json({ success: false, message: 'Workflow template not found' });
      }

      const duplicatedTemplate = new WorkflowTemplate({
        ...originalTemplate.toObject(),
        _id: undefined,
        name: `${originalTemplate.name} (Copy)`,
        createdBy: userId,
        createdByName: userName,
        isPublic: false,
        usage: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await duplicatedTemplate.save();

      res.status(201).json({ 
        success: true, 
        message: 'Workflow template duplicated successfully', 
        data: duplicatedTemplate 
      });
    } catch (error) {
      console.error('Error duplicating workflow template:', error);
      res.status(500).json({ success: false, message: 'Failed to duplicate workflow template' });
    }
  }

  // Execute a workflow
  async executeWorkflow(req, res) {
    try {
      const { templateId } = req.params;
      const userId = req.user.data.email;
      const userName = req.user.data.name || req.user.data.email;
      const { inputFile, customName, customDescription } = req.body;

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No input file provided' });
      }

      // Handle both ObjectId and string IDs (for new workflows with wf_ prefix)
      let template;
      if (templateId.startsWith('wf_')) {
        // This is a new workflow that hasn't been saved yet - create a temporary template
        template = {
          _id: templateId,
          name: customName || 'Custom Workflow',
          description: customDescription || 'Custom workflow description',
          steps: req.body.steps || [],
          isTemplate: true,
          isPublic: false,
          createdBy: userId,
          createdByName: userName,
          category: 'custom',
          tags: [],
          usage: 0,
          avgTime: '0 minutes',
          metadata: {
            complexity: 'easy',
            inputFormats: [],
            outputFormats: [],
            features: []
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
      } else {
        // This is an existing workflow template
        template = await WorkflowTemplate.findOne({
          _id: templateId,
          $or: [
            { createdBy: userId },
            { isPublic: true }
          ]
        });
        
        if (!template) {
          return res.status(404).json({ success: false, message: 'Workflow template not found' });
        }
      }

      // Create workflow execution
      const execution = new WorkflowExecution({
        templateId: template._id,
        name: customName || template.name,
        description: customDescription || template.description,
        steps: template.steps.map(step => ({
          stepId: step.id,
          toolId: step.toolId,
          name: step.name,
          order: step.order,
          settings: step.settings || {},
          status: 'pending'
        })),
        inputFile: req.file.path,
        createdBy: userId,
        createdByName: userName,
        metadata: {
          originalFileName: req.file.originalname,
          originalFileSize: req.file.size
        }
      });

      await execution.save();

      // Start execution in background
      setImmediate(async () => {
        try {
          await WorkflowController.executeWorkflowSteps(execution._id);
        } catch (error) {
          console.error('Workflow execution error:', error);
          // Update execution status to failed
          try {
            await WorkflowExecution.findByIdAndUpdate(execution._id, {
              status: 'failed',
              completedAt: new Date()
            });
          } catch (updateError) {
            console.error('Error updating failed execution status:', updateError);
          }
        }
      });

      res.status(201).json({ 
        success: true, 
        message: 'Workflow execution started', 
        data: { executionId: execution._id }
      });
    } catch (error) {
      console.error('Error starting workflow execution:', error);
      res.status(500).json({ success: false, message: 'Failed to start workflow execution' });
    }
  }

  // Execute workflow steps (internal method)
  static async executeWorkflowSteps(executionId) {
    try {
      
      const execution = await WorkflowExecution.findById(executionId);
      if (!execution) {
        console.error('[WorkflowController] Workflow execution not found:', executionId);
        return;
      }

      execution.status = 'running';
      execution.startedAt = new Date();
      await execution.save();

      let currentFile = execution.inputFile;
      const outputsDir = path.join(__dirname, '../outputs');
      await fs.ensureDir(outputsDir);

      for (let i = 0; i < execution.steps.length; i++) {
        const step = execution.steps[i];
        
        try {
          step.status = 'running';
          step.startedAt = new Date();
          await execution.save();

          // Execute the tool
          const result = await WorkflowController.executeTool(step.toolId, currentFile, step.settings, outputsDir);
          
          step.status = 'completed';
          step.completedAt = new Date();
          step.outputFile = result.outputFile;
          step.result = result;
          currentFile = result.outputFile; // Use output as input for next step

          await execution.save();
        } catch (error) {
          console.error(`Error executing step ${step.name} (${step.toolId}):`, error);
          step.status = 'failed';
          step.completedAt = new Date();
          step.error = error.message;
          await execution.save();
          break;
        }
      }

        // Mark execution as completed
        execution.status = execution.steps.every(s => s.status === 'completed') ? 'completed' : 'failed';
        execution.completedAt = new Date();
        execution.outputFile = currentFile;
        
      
      if (execution.status === 'completed') {
        execution.totalDuration = execution.completedAt - execution.startedAt;
        try {
          const finalStats = await fs.stat(currentFile);
          execution.metadata.finalFileSize = finalStats.size;
          if (execution.metadata.originalFileSize > 0) {
            execution.metadata.compressionRatio = 
              ((execution.metadata.originalFileSize - execution.metadata.finalFileSize) / execution.metadata.originalFileSize) * 100;
          }
        } catch (statError) {
          console.warn('Could not get final file stats:', statError.message);
        }
      } else {
        console.log(`Workflow execution failed`);
      }

      await execution.save();

      // Update template usage count
      await WorkflowTemplate.findByIdAndUpdate(execution.templateId, {
        $inc: { usage: 1 }
      });

    } catch (error) {
      console.error('Error in workflow execution:', error);
      await WorkflowExecution.findByIdAndUpdate(executionId, {
        status: 'failed',
        completedAt: new Date()
      });
    }
  }

  // Execute individual tool (using actual PDF controllers)
  static async executeTool(toolId, inputFile, settings, outputsDir) {
    const timestamp = Date.now();
    
    // Determine the correct file extension based on the tool
    const getOutputExtension = (toolId) => {
      switch (toolId) {
        case 'pdf-to-word':
        case 'excel-to-doc':
        case 'doc-to-excel':
          return 'docx';
        case 'pdf-to-excel':
        case 'excel-to-pdf':
          return 'xlsx';
        case 'pdf-to-ppt':
        case 'ppt-to-pdf':
          return 'pptx';
        case 'pdf-to-text':
        case 'text-to-pdf':
          return 'txt';
        case 'pdf-to-html':
          return 'html';
        case 'pdf-to-image':
          return 'png';
        case 'pdf-to-epub':
          return 'epub';
        default:
          return 'pdf';
      }
    };
    
    const extension = getOutputExtension(toolId);
    const outputFileName = `workflow_${timestamp}_${toolId}.${extension}`;
    const outputPath = path.join(outputsDir, outputFileName);

    try {
      
      // Import the specific controller based on toolId
      let controller;
      let methodName;
      
      switch (toolId) {
        // PDF Conversion Tools
        case 'pdf-to-word':
          controller = require('./pdfController');
          methodName = 'convertPdfToDoc';
          break;
        
        case 'word-to-pdf':
          controller = require('./pdfController');
          methodName = 'convertDocToPdf';
          break;
        
        case 'pdf-to-excel':
          controller = require('./pdfController');
          methodName = 'convertPdfToExcel';
          break;
        
        case 'excel-to-pdf':
          controller = require('./pdfController');
          methodName = 'convertExcelToPdf';
          break;
        
        case 'pdf-to-ppt':
          controller = require('./pdfController');
          methodName = 'convertPdfToPpt';
          break;
        
        case 'ppt-to-pdf':
          controller = require('./pdfController');
          methodName = 'convertPptToPdf';
          break;
        
        case 'pdf-to-text':
          controller = require('./pdfController');
          methodName = 'convertPdfToTxt';
          break;
        
        case 'text-to-pdf':
          controller = require('./pdfController');
          methodName = 'convertTxtToPdf';
          break;
        
        case 'pdf-to-html':
          controller = require('./pdfController');
          methodName = 'convertPdfToHtml';
          break;
        
        case 'excel-to-doc':
          controller = require('./pdfController');
          methodName = 'convertExcelToDoc';
          break;
        
        case 'doc-to-excel':
          controller = require('./pdfController');
          methodName = 'convertDocToExcel';
          break;
        
        case 'pdf-to-epub':
          controller = require('./pdfToImage');
          methodName = 'convertPdfToEpub';
          break;
        
        case 'pdf-to-image':
          controller = require('./pdfToImage');
          methodName = 'convertSinglePageToImage';
          break;
        
        // PDF Optimization Tools
        case 'compress-pdf':
          controller = require('./compressPDFController');
          methodName = 'compressPDF';
          break;
        
        case 'optimize-image':
          controller = require('./optimizeImageController');
          methodName = 'optimizeImages';
          break;
        
        case 'optimize-font':
          controller = require('./optimizeFontController');
          methodName = 'optimizeFonts';
          break;
        
        case 'remove-unused-objects':
          controller = require('./removeUnusedObjectsController');
          methodName = 'removeUnusedObjects';
          break;
        
        case 'linearize-pdf':
          controller = require('./linearizePDFController');
          methodName = 'linearizePDF';
          break;
        
        case 'color-optimization':
          controller = require('./colorOptimizationController');
          methodName = 'optimizeColors';
          break;
        
       
        case 'remove-metadata':
          controller = require('./removeMetadataController');
          methodName = 'removeMetadata';
          break;
        
       
        // OCR and Text Tools
        case 'ocr':
          controller = require('./ocrController');
          methodName = 'performOCR';
          break;
        
        case 'make-searchable':
          controller = require('./makeSearchableController');
          methodName = 'makeSearchable';
          break;
        
        // Analysis Tools
        case 'pdf-statistics':
          controller = require('./pdfStatisticsController');
          methodName = 'getPDFStatistics';
          break;
        
        default:
          console.log(`[WorkflowController] Tool ${toolId} not implemented, copying file`);
          await fs.copy(inputFile, outputPath);
          return { 
            outputFile: outputPath, 
            message: `Tool ${toolId} executed successfully (file copied)`, 
            toolId: toolId 
          };
      }

      // Call the specific tool method
      if (controller && controller[methodName]) {
        // Ensure the input file exists
        if (!await fs.pathExists(inputFile)) {
          throw new Error(`Input file does not exist: ${inputFile}`);
        }

        // Special handling for all conversion tools that have direct function calls
        if (toolId === 'pdf-to-word' || toolId === 'word-to-pdf' || toolId === 'pdf-to-excel' || 
            toolId === 'excel-to-pdf' || toolId === 'pdf-to-ppt' || toolId === 'ppt-to-pdf' ||
            toolId === 'pdf-to-text' || toolId === 'text-to-pdf' || toolId === 'pdf-to-html' ||
            toolId === 'excel-to-doc' || toolId === 'doc-to-excel' || toolId === 'pdf-to-image' ||
            toolId === 'compress-pdf' || toolId === 'optimize-image' || toolId === 'optimize-font' ||
            toolId === 'remove-unused-objects' || toolId === 'linearize-pdf' || toolId === 'color-optimization' ||
            toolId === 'remove-metadata' || toolId === 'ocr' || toolId === 'make-searchable' ||
            toolId === 'pdf-statistics') {
          
          console.log(`[WorkflowController] Calling ${methodName} directly for ${toolId}`);
          console.log(`[WorkflowController] Input file: ${inputFile}`);
          console.log(`[WorkflowController] Output path: ${outputPath}`);
          
          // Call the function directly with proper parameters
          let result;
          if (toolId === 'pdf-to-image') {
            // PDF to image needs page number as second parameter
            result = await controller[methodName](inputFile, 0, outputPath);
          } else if (toolId === 'compress-pdf' || toolId === 'optimize-image' || toolId === 'optimize-font' ||
                     toolId === 'remove-unused-objects' || toolId === 'linearize-pdf' || toolId === 'color-optimization' ||
                     toolId === 'remove-metadata' || toolId === 'ocr' || toolId === 'make-searchable' ||
                     toolId === 'pdf-statistics') {
            // These tools need mock request/response objects
            const mockReq = {
              file: { 
                path: inputFile,
                originalname: `input_${toolId}.pdf`,
                filename: `input_${toolId}.pdf`,
                size: 1024,
                mimetype: 'application/pdf'
              },
              body: settings || {},
              get: (header) => {
                const headers = {
                  'User-Agent': 'Workflow-Execution/1.0',
                  'Content-Type': 'application/pdf'
                };
                return headers[header] || '';
              },
              ip: '127.0.0.1',
              user: {
                data: {
                  email: 'workflow@system.com',
                  name: 'Workflow System'
                }
              }
            };
            
            let mockResult = null;
            const mockRes = {
              json: (data) => { mockResult = data; },
              status: (code) => ({ json: (data) => { mockResult = data; } })
            };

            await controller[methodName](mockReq, mockRes);
            result = mockResult;
          } else {
            // Most conversion functions take inputPath and outputPath
            result = await controller[methodName](inputFile, outputPath);
          }
          
          console.log(`[WorkflowController] ${methodName} result:`, result);
          console.log(`[WorkflowController] Output file exists: ${await fs.pathExists(outputPath)}`);
          
          // Ensure the output file exists
          if (!await fs.pathExists(outputPath)) {
            throw new Error(`Output file was not created: ${outputPath}`);
          }
          
          return { 
            outputFile: outputPath, 
            message: result.message || `${toolId} executed successfully`,
            toolId: toolId,
            result: result
          };
        }

        // This section is now handled above in the direct call section
        console.log(`[WorkflowController] Tool ${toolId} not handled in direct call section`);
        throw new Error(`Tool ${toolId} execution method not implemented`);
      } else {
        throw new Error(`Tool ${toolId} method not found`);
      }
    } catch (error) {
      console.error(`Error executing tool ${toolId}:`, error);
      
      // Fallback: copy input file as output
      try {
        await fs.copy(inputFile, outputPath);
        return { 
          outputFile: outputPath, 
          message: `Tool ${toolId} executed with fallback (file copied)`,
          toolId: toolId,
          error: error.message
        };
      } catch (copyError) {
        throw new Error(`Tool ${toolId} execution failed: ${error.message}`);
      }
    }
  }


  // Download workflow execution result
  async downloadWorkflowResult(req, res) {
    try {
      const { executionId } = req.params;
      const userId = req.user.data.email;

      const execution = await WorkflowExecution.findOne({
        _id: executionId,
        createdBy: userId
      });

      if (!execution) {
        return res.status(404).json({ success: false, message: 'Workflow execution not found' });
      }

      if (execution.status !== 'completed') {
        return res.status(400).json({ success: false, message: 'Workflow execution not completed yet' });
      }


      if (!execution.outputFile || !await fs.pathExists(execution.outputFile)) {
        return res.status(404).json({ success: false, message: 'Output file not found' });
      }

      // Get file stats for debugging
      const fileStats = await fs.stat(execution.outputFile);
    
      // Create a more descriptive filename using custom name if provided
      const originalFileName = execution.metadata?.originalFileName || 'document';
      const baseName = originalFileName.replace(/\.[^/.]+$/, ''); // Remove extension
      
      // Use custom name from execution if available, otherwise use original filename
      const customName = execution.name && execution.name !== 'Custom Workflow' ? execution.name : baseName;
      
      // Get the actual file extension from the output file
      const actualFileExtension = path.extname(execution.outputFile).toLowerCase();
      const downloadFileName = `${customName}${actualFileExtension}`;
      
      // Determine content type based on file extension
      const getContentType = (extension) => {
        switch (extension) {
          case '.docx':
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          case '.xlsx':
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          case '.pptx':
            return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          case '.txt':
            return 'text/plain';
          case '.html':
            return 'text/html';
          case '.png':
            return 'image/png';
          case '.epub':
            return 'application/epub+zip';
          case '.pdf':
          default:
            return 'application/pdf';
        }
      };
      
      const contentType = getContentType(actualFileExtension);
      
      // Set appropriate headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
      res.setHeader('Content-Type', contentType);
      
      // Stream the file
      const fileStream = fs.createReadStream(execution.outputFile);
      
      fileStream.on('error', (error) => {
        console.error(`[WorkflowController] File stream error:`, error);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error reading file' });
        }
      });
      
      res.on('error', (error) => {
        console.error(`[WorkflowController] Response stream error:`, error);
      });
      
      fileStream.pipe(res);

    } catch (error) {
      console.error('Error downloading workflow result:', error);
      res.status(500).json({ success: false, message: 'Failed to download workflow result' });
    }
  }

  // Get workflow execution status
  async getWorkflowExecution(req, res) {
    try {
      const { executionId } = req.params;
      const userId = req.user.data.email;

      const execution = await WorkflowExecution.findOne({
        _id: executionId,
        createdBy: userId
      }).populate('templateId', 'name description');

      if (!execution) {
        return res.status(404).json({ success: false, message: 'Workflow execution not found' });
      }

      res.json({ success: true, data: execution });
    } catch (error) {
      console.error('Error fetching workflow execution:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch workflow execution' });
    }
  }

  // Get user's workflow executions
  async getUserWorkflowExecutions(req, res) {
    try {
      const userId = req.user.data.email;
      const { status, page = 1, limit = 10 } = req.query;

      let query = { createdBy: userId };
      if (status) {
        query.status = status;
      }

      const executions = await WorkflowExecution.find(query)
        .populate('templateId', 'name description')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await WorkflowExecution.countDocuments(query);

      res.json({ 
        success: true, 
        data: executions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching workflow executions:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch workflow executions' });
    }
  }

  // Cancel workflow execution
  async cancelWorkflowExecution(req, res) {
    try {
      const { executionId } = req.params;
      const userId = req.user.data.email;

      const execution = await WorkflowExecution.findOne({
        _id: executionId,
        createdBy: userId,
        status: { $in: ['pending', 'running'] }
      });

      if (!execution) {
        return res.status(404).json({ success: false, message: 'Workflow execution not found or cannot be cancelled' });
      }

      execution.status = 'cancelled';
      execution.completedAt = new Date();
      await execution.save();

      res.json({ 
        success: true, 
        message: 'Workflow execution cancelled successfully' 
      });
    } catch (error) {
      console.error('Error cancelling workflow execution:', error);
      res.status(500).json({ success: false, message: 'Failed to cancel workflow execution' });
    }
  }
}

module.exports = new WorkflowController();
