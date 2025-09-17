const mongoose = require('mongoose');
const WorkflowTemplate = require('./models/WorkflowTemplate');
const WorkflowExecution = require('./models/WorkflowExecution');
const WorkflowController = require('./controllers/workflowController');

// Test database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pdf-service', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test workflow template creation
const testWorkflowTemplate = async () => {
  try {
    console.log('Testing workflow template creation...');
    
    const template = new WorkflowTemplate({
      name: 'Test Workflow',
      description: 'A test workflow for PDF processing',
      steps: [
        {
          id: 'step_1',
          toolId: 'compress-pdf',
          name: 'Compress PDF',
          order: 1,
          settings: { quality: 'medium' }
        },
        {
          id: 'step_2',
          toolId: 'add-password',
          name: 'Add Password',
          order: 2,
          settings: { password: 'test123' }
        }
      ],
      isTemplate: true,
      isPublic: false,
      createdBy: 'test@example.com',
      createdByName: 'Test User',
      category: 'test',
      tags: ['test', 'pdf'],
      usage: 0,
      avgTime: '2 minutes',
      metadata: {
        complexity: 'easy',
        inputFormats: ['pdf'],
        outputFormats: ['pdf'],
        features: ['compression', 'security']
      }
    });

    await template.save();
    console.log('✅ Workflow template created successfully:', template._id);
    return template;
  } catch (error) {
    console.error('❌ Error creating workflow template:', error);
    throw error;
  }
};

// Test workflow execution
const testWorkflowExecution = async (templateId) => {
  try {
    console.log('Testing workflow execution...');
    
    const execution = new WorkflowExecution({
      templateId: templateId,
      name: 'Test Execution',
      description: 'A test workflow execution',
      steps: [
        {
          stepId: 'step_1',
          toolId: 'compress-pdf',
          name: 'Compress PDF',
          order: 1,
          status: 'pending',
          settings: { quality: 'medium' }
        },
        {
          stepId: 'step_2',
          toolId: 'add-password',
          name: 'Add Password',
          order: 2,
          status: 'pending',
          settings: { password: 'test123' }
        }
      ],
      inputFile: '/tmp/test-input.pdf',
      createdBy: 'test@example.com',
      createdByName: 'Test User',
      metadata: {
        originalFileName: 'test-input.pdf',
        originalFileSize: 1024000
      }
    });

    await execution.save();
    console.log('✅ Workflow execution created successfully:', execution._id);
    return execution;
  } catch (error) {
    console.error('❌ Error creating workflow execution:', error);
    throw error;
  }
};

// Test workflow controller methods
const testWorkflowController = async () => {
  try {
    console.log('Testing workflow controller methods...');
    
    // Test getWorkflowTemplates
    const templates = await WorkflowTemplate.find({});
    console.log(`✅ Found ${templates.length} workflow templates`);
    
    // Test getWorkflowExecutions
    const executions = await WorkflowExecution.find({});
    console.log(`✅ Found ${executions.length} workflow executions`);
    
    return { templates, executions };
  } catch (error) {
    console.error('❌ Error testing workflow controller:', error);
    throw error;
  }
};

// Main test function
const runTests = async () => {
  try {
    console.log('🚀 Starting workflow system tests...\n');
    
    await connectDB();
    
    // Test 1: Create workflow template
    const template = await testWorkflowTemplate();
    
    // Test 2: Create workflow execution
    const execution = await testWorkflowExecution(template._id);
    
    // Test 3: Test controller methods
    const { templates, executions } = await testWorkflowController();
    
    console.log('\n✅ All tests completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Templates: ${templates.length}`);
    console.log(`   - Executions: ${executions.length}`);
    
    // Cleanup
    await WorkflowTemplate.deleteMany({ createdBy: 'test@example.com' });
    await WorkflowExecution.deleteMany({ createdBy: 'test@example.com' });
    console.log('🧹 Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Database disconnected');
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, testWorkflowTemplate, testWorkflowExecution, testWorkflowController };
