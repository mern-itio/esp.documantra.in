const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:4002';
const USER_TOKEN = 'your_jwt_token_here'; // Replace with actual token from auth service
const USER_ID = '6899e995d320ac35f2b3c1cd'; // From localStorage

// Test data
const testFolder = {
  name: 'Test Work Documents',
  description: 'Test folder for work documents',
  color: '#3b82f6'
};

const testDocument = {
  name: 'test-document.txt',
  description: 'Test document for API testing',
  tags: 'test,api,document'
};

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${USER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message);
    return null;
  }
};

// Test functions
const testHealthCheck = async () => {
  console.log('🔍 Testing health check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
};

const testCreateFolder = async () => {
  console.log('\n📁 Testing folder creation...');
  const result = await makeRequest('POST', '/api/folders', testFolder);
  if (result && result.success) {
    console.log('✅ Folder created successfully:', result.data);
    return result.data._id;
  } else {
    console.log('❌ Folder creation failed');
    return null;
  }
};

const testGetFolders = async () => {
  console.log('\n📂 Testing get folders...');
  const result = await makeRequest('GET', '/api/folders');
  if (result && result.success) {
    console.log('✅ Folders retrieved successfully:', result.data.length, 'folders found');
    return result.data;
  } else {
    console.log('❌ Get folders failed');
    return null;
  }
};

const testGetFolderDetails = async (folderId) => {
  if (!folderId) return;
  
  console.log('\n📋 Testing get folder details...');
  const result = await makeRequest('GET', `/api/folders/${folderId}`);
  if (result && result.success) {
    console.log('✅ Folder details retrieved successfully');
    console.log('   - Folder:', result.data.folder.name);
    console.log('   - Subfolders:', result.data.subfolders.length);
    console.log('   - Documents:', result.data.documents.length);
  } else {
    console.log('❌ Get folder details failed');
  }
};

const testUpdateFolder = async (folderId) => {
  if (!folderId) return;
  
  console.log('\n✏️ Testing folder update...');
  const updateData = {
    name: 'Updated Test Folder',
    description: 'This folder has been updated',
    color: '#ef4444'
  };
  
  const result = await makeRequest('PUT', `/api/folders/${folderId}`, updateData);
  if (result && result.success) {
    console.log('✅ Folder updated successfully:', result.data.name);
  } else {
    console.log('❌ Folder update failed');
  }
};

const testDeleteFolder = async (folderId) => {
  if (!folderId) return;
  
  console.log('\n🗑️ Testing folder deletion...');
  const result = await makeRequest('DELETE', `/api/folders/${folderId}`);
  if (result && result.success) {
    console.log('✅ Folder deleted successfully');
  } else {
    console.log('❌ Folder deletion failed');
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Document Service API Tests...\n');
  
  // Test health check first
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('❌ Service is not running. Please start the service first.');
    return;
  }
  
  // Test folder operations
  const folderId = await testCreateFolder();
  await testGetFolders();
  await testGetFolderDetails(folderId);
  await testUpdateFolder(folderId);
  await testDeleteFolder(folderId);
  
  console.log('\n✨ All tests completed!');
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testHealthCheck,
  testCreateFolder,
  testGetFolders,
  testGetFolderDetails,
  testUpdateFolder,
  testDeleteFolder
};
