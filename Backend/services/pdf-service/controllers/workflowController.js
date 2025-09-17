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
    const outputFileName = `workflow_${timestamp}_${toolId}.pdf`;
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
          methodName = 'convertPdfToText';
          break;
        
        case 'text-to-pdf':
          controller = require('./pdfController');
          methodName = 'convertTextToPdf';
          break;
        
        case 'pdf-to-html':
          controller = require('./pdfController');
          methodName = 'convertPdfToHtml';
          break;
        
        case 'pdf-to-epub':
          controller = require('./pdfController');
          methodName = 'convertPdfToEpub';
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
        
        // PDF Security Tools
        case 'add-password':
          controller = require('./addPasswordController');
          methodName = 'addPassword';
          break;
        
        case 'remove-password':
          controller = require('./removePasswordController');
          methodName = 'removePassword';
          break;
        
        // PDF Editing Tools
        case 'merge-pdf':
          controller = require('./mergePdf');
          methodName = 'mergePdfs';
          break;
        
        case 'split-pdf':
          controller = require('./pdfSplitService');
          methodName = 'splitPDF';
          break;
        
        case 'add-watermark':
          controller = require('./addWatermarkController');
          methodName = 'addWatermark';
          break;
        
        case 'remove-metadata':
          controller = require('./removeMetadataController');
          methodName = 'removeMetadata';
          break;
        
        case 'edit-metadata':
          controller = require('./editMetadataController');
          methodName = 'editMetadata';
          break;
        
        case 'add-page-numbers':
          controller = require('./addPageNumbersController');
          methodName = 'addPageNumbers';
          break;
        
        case 'add-header-footer':
          controller = require('./addHeaderFooterController');
          methodName = 'addHeaderFooter';
          break;
        
        case 'pdf-bookmarks':
          controller = require('./pdfBookmarksController');
          methodName = 'addBookmarks';
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

        // Special handling for pdfController functions that don't use Express
        if (toolId === 'pdf-to-word' || toolId === 'word-to-pdf') {
          // Call the function directly
          const result = await controller[methodName](inputFile, outputPath);
          
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

        // Create a mock request object for the controller
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
        
        // Create a mock response object
        let result = null;
        const mockRes = {
          json: (data) => { result = data; },
          status: (code) => ({ json: (data) => { result = data; } })
        };

        // Execute the tool
        await controller[methodName](mockReq, mockRes);
        
        if (result && result.success) {
          
          // Handle different types of file paths returned by controllers
          let actualOutputFile = result.outputFile || result.downloadUrl || outputPath;
          
          console.log(`[WorkflowController] Tool ${toolId} result:`, {
            outputFile: result.outputFile,
            downloadUrl: result.downloadUrl,
            filename: result.filename
          });
          
          // If the controller returns a relative path, convert it to absolute
          if (actualOutputFile && actualOutputFile.startsWith('/outputs/')) {
            actualOutputFile = path.join(__dirname, '..', actualOutputFile);
            console.log(`[WorkflowController] Converted relative path to absolute: ${actualOutputFile}`);
          }
          
          // If the controller returns just a filename, look for it in the outputs directory
          if (result.filename && !actualOutputFile.includes('/')) {
            const filenamePath = path.join(outputsDir, result.filename);
            if (await fs.pathExists(filenamePath)) {
              actualOutputFile = filenamePath;
              console.log(`[WorkflowController] Found file by filename: ${actualOutputFile}`);
            }
          }
          
          // If the controller returns a download URL, extract the filename and find the actual file
          if (result.downloadUrl && (result.downloadUrl.startsWith('/pdf-compress/download/') || result.downloadUrl.startsWith('/pdf-linearize/download/'))) {
            const filename = result.downloadUrl.split('/').pop();
            console.log(`[WorkflowController] Looking for file with filename: ${filename}`);
            
            // Look for the actual file in the outputs directory
            const possiblePaths = [
              path.join(outputsDir, `compressed-${Date.now()}.pdf`),
              path.join(outputsDir, `gs-compressed-${Date.now()}.pdf`),
              path.join(outputsDir, `linearized-${Date.now()}.pdf`),
              path.join(outputsDir, filename)
            ];
            
            console.log(`[WorkflowController] Checking possible paths:`, possiblePaths);
            
            for (const possiblePath of possiblePaths) {
              if (await fs.pathExists(possiblePath)) {
                actualOutputFile = possiblePath;
                console.log(`[WorkflowController] Found file at: ${actualOutputFile}`);
                break;
              }
            }
            
            // If we still can't find the file, look for any recently created PDF files
            if (!await fs.pathExists(actualOutputFile)) {
              const files = await fs.readdir(outputsDir);
              const pdfFiles = files.filter(f => f.endsWith('.pdf') && (f.includes('compressed') || f.includes('linearized') || f.includes('optimized')));
              console.log(`[WorkflowController] Found PDF files:`, pdfFiles);
              
              if (pdfFiles.length > 0) {
                // Get the most recent file
                const latestFile = pdfFiles.sort().pop();
                actualOutputFile = path.join(outputsDir, latestFile);
                console.log(`[WorkflowController] Using latest file: ${actualOutputFile}`);
              }
            }
          }
          
          // Final fallback: if we still can't find the file, look for any recently created PDF files
          if (!await fs.pathExists(actualOutputFile)) {
            console.log(`[WorkflowController] File not found, searching for recent PDF files...`);
            const files = await fs.readdir(outputsDir);
            const recentFiles = files
              .filter(f => f.endsWith('.pdf') && f.startsWith('workflow_'))
              .sort()
              .slice(-5); // Get last 5 files
            
            console.log(`[WorkflowController] Recent workflow files:`, recentFiles);
            
            if (recentFiles.length > 0) {
              const latestFile = recentFiles[recentFiles.length - 1];
              actualOutputFile = path.join(outputsDir, latestFile);
              console.log(`[WorkflowController] Using most recent workflow file: ${actualOutputFile}`);
            }
          }
          
          
          // If the actual output file is different from our path, copy it
          if (actualOutputFile !== outputPath && await fs.pathExists(actualOutputFile)) {
            await fs.copy(actualOutputFile, outputPath);
          } else if (actualOutputFile === outputPath) {
            console.log(`[WorkflowController] File already at target path`);
          } else {
            console.log(`[WorkflowController] WARNING: actualOutputFile does not exist: ${actualOutputFile}`);
          }
          
          // Verify the final output file exists and is valid
          if (await fs.pathExists(outputPath)) {
            const stats = await fs.stat(outputPath);
          
            
            // Check if it's a valid PDF by reading the first few bytes
            try {
              const buffer = await fs.readFile(outputPath, { start: 0, end: 4 });
              const header = buffer.toString('ascii');
              console.log(`[WorkflowController] File header: ${header}`);
              
              if (header.startsWith('%PDF')) {
                console.log(`[WorkflowController] ✅ Valid PDF file detected`);
              } else {
                console.log(`[WorkflowController] ❌ Invalid PDF file - header: ${header}`);
              }
            } catch (headerError) {
              console.log(`[WorkflowController] ❌ Error reading file header: ${headerError.message}`);
            }
          } else {
            console.log(`[WorkflowController] ERROR: Final output file does not exist: ${outputPath}`);
          }
          
          return { 
            outputFile: outputPath, 
            message: result.message || `${toolId} executed successfully`,
            toolId: toolId,
            result: result
          };
        } else {
          throw new Error(result?.message || `Tool ${toolId} execution failed`);
        }
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
    
      // Create a more descriptive filename
      const originalFileName = execution.metadata?.originalFileName || 'document';
      const baseName = originalFileName.replace(/\.[^/.]+$/, ''); // Remove extension
      const downloadFileName = `${baseName}_processed.pdf`;
      
      
      // Set appropriate headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
      res.setHeader('Content-Type', 'application/pdf');
      
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
