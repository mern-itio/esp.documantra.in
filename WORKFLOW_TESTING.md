# PDF Workflow System Testing Guide

This guide explains how to test the PDF workflow system to ensure it's working correctly.

## Prerequisites

1. **MongoDB** - Ensure MongoDB is running
2. **PDF Service** - Ensure the PDF service is running on port 2104
3. **Dependencies** - All required packages are installed

## Quick Test

### 1. Test Database Models

Run the workflow test script:

```bash
cd Backend/services/pdf-service
node test-workflow.js
```

This will test:
- Database connection
- Workflow template creation
- Workflow execution creation
- Controller methods
- Data cleanup

### 2. Test API Endpoints

#### Create a Workflow Template

```bash
curl -X POST http://localhost:2104/workflows/templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Workflow",
    "description": "A test workflow for PDF processing",
    "steps": [
      {
        "id": "step_1",
        "toolId": "compress-pdf",
        "name": "Compress PDF",
        "order": 1,
        "settings": {"quality": "medium"}
      }
    ],
    "category": "test",
    "tags": ["test", "pdf"]
  }'
```

#### Get Workflow Templates

```bash
curl -X GET http://localhost:2104/workflows/templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Execute a Workflow

```bash
curl -X POST http://localhost:2104/workflows/templates/TEMPLATE_ID/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-document.pdf"
```

### 3. Test Frontend Integration

1. **Start the Frontend**:
   ```bash
   cd Frontend
   npm run dev
   ```

2. **Navigate to Workflow Designer**:
   - Go to PDF Tools section
   - Click on "Workflow Designer"
   - You should see the workflow management interface

3. **Create a New Workflow**:
   - Click "New Workflow"
   - Add steps by dragging tools from the tools panel
   - Configure step settings
   - Save the workflow

4. **Execute a Workflow**:
   - Select a saved workflow
   - Click "Run Workflow"
   - Upload a PDF file
   - Monitor execution progress

## Expected Behavior

### Backend Tests
- ✅ Database connection successful
- ✅ Workflow template created with correct structure
- ✅ Workflow execution created with correct steps
- ✅ Controller methods return expected data
- ✅ Test data cleaned up properly

### API Tests
- ✅ POST /workflows/templates returns 201 with template data
- ✅ GET /workflows/templates returns 200 with template list
- ✅ POST /workflows/templates/:id/execute returns 201 with execution ID
- ✅ GET /workflows/executions/:id returns 200 with execution status

### Frontend Tests
- ✅ WorkflowDesigner loads without errors
- ✅ Can create new workflows
- ✅ Can add/remove workflow steps
- ✅ Can save workflow templates
- ✅ Can execute workflows with file upload
- ✅ Shows execution progress and status

## Troubleshooting

### Common Issues

1. **"Cannot read properties of undefined (reading 'executeWorkflowSteps')"**
   - **Solution**: This has been fixed by making the method static
   - **Status**: ✅ Fixed

2. **Database Connection Error**
   - **Solution**: Ensure MongoDB is running and connection string is correct
   - **Check**: `mongodb://localhost:27017/pdf-service`

3. **Authentication Error**
   - **Solution**: Ensure valid JWT token is provided
   - **Check**: Token in localStorage or Authorization header

4. **File Upload Error**
   - **Solution**: Ensure file is valid PDF and under size limit
   - **Check**: File size < 100MB, valid PDF format

5. **Tool Execution Error**
   - **Solution**: Check if specific PDF tool controller exists
   - **Check**: Tool ID matches available controllers

### Debug Mode

Enable debug logging by setting environment variable:

```bash
export DEBUG=pdf-service:workflow
```

### Log Files

Check the following logs for errors:
- PDF Service logs: `Backend/services/pdf-service/logs/`
- MongoDB logs: Check MongoDB log output
- Frontend console: Browser developer tools

## Performance Testing

### Load Testing

Test with multiple concurrent workflow executions:

```bash
# Run multiple executions simultaneously
for i in {1..5}; do
  curl -X POST http://localhost:2104/workflows/templates/TEMPLATE_ID/execute \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -F "file=@test-document-$i.pdf" &
done
wait
```

### Memory Testing

Monitor memory usage during workflow execution:

```bash
# Monitor Node.js process
ps aux | grep node
top -p $(pgrep node)
```

## Integration Testing

### End-to-End Test

1. **Create Workflow**: Use frontend to create a workflow
2. **Execute Workflow**: Upload file and execute
3. **Monitor Progress**: Check execution status
4. **Download Result**: Get processed file
5. **Verify Output**: Ensure file was processed correctly

### Cross-Service Testing

Test integration with other services:
- Document Service integration
- Authentication Service integration
- File Storage Service integration

## Test Data

### Sample Workflow Templates

```json
{
  "name": "Document Preparation",
  "description": "Complete document preparation workflow",
  "steps": [
    {
      "id": "step_1",
      "toolId": "compress-pdf",
      "name": "Compress PDF",
      "order": 1,
      "settings": {"quality": "high"}
    },
    {
      "id": "step_2",
      "toolId": "add-password",
      "name": "Add Security",
      "order": 2,
      "settings": {"password": "secure123"}
    }
  ]
}
```

### Test Files

Use these test files for workflow execution:
- `test-document.pdf` - Small PDF file (< 1MB)
- `test-large.pdf` - Large PDF file (> 10MB)
- `test-corrupted.pdf` - Corrupted PDF for error testing

## Success Criteria

The workflow system is working correctly if:

1. ✅ All backend tests pass
2. ✅ All API endpoints return expected responses
3. ✅ Frontend loads and functions without errors
4. ✅ Workflows can be created, saved, and executed
5. ✅ File processing works correctly
6. ✅ Error handling works as expected
7. ✅ Performance is acceptable (< 30s for simple workflows)

## Next Steps

After successful testing:

1. **Deploy to Production**: Follow deployment guide
2. **Monitor Performance**: Set up monitoring and alerts
3. **User Training**: Create user documentation
4. **Feature Enhancement**: Add requested features
5. **Scale Testing**: Test with production load
