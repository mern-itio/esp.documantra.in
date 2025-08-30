const { 
  parseTextForTables, 
  isTableHeaderLine, 
  isTableDataLine,
  reconstructTableFromPartialData 
} = require('./controllers/extractTablesController');

async function testTableDetectionLogic() {
  console.log('🧪 Testing table detection logic with sample data...\n');
  
  // Sample text lines that represent the problematic data from the user's logs
  const sampleLines = [
    // Garbled text that should be filtered out
    'FE EC Nl ial',
    'nl ee',
    'ma I HO NO id iid',
    'A A il il',
    
    // Valid table data that should be detected
    'Low Vision 5 2 3 98.3% n=2 1716 sec, n=3',
    'Deaf 3 1 2 95.2% n=1 1420 sec, n=2',
    'Mobility 4 2 2 97.8% n=2 1890 sec, n=2',
    
    // Mixed content that might be ambiguous
    'Test Participant 1 1 1 100% n=1 1200 sec, n=1',
    'Control Group 2 1 1 98.5% n=1 1100 sec, n=1'
  ];
  
  console.log('📝 Testing each line individually:');
  console.log('=' .repeat(60));
  
  sampleLines.forEach((line, index) => {
    const isHeader = isTableHeaderLine(line);
    const isData = isTableDataLine(line);
    
    console.log(`Line ${index + 1}: "${line}"`);
    console.log(`  Header: ${isHeader}, Data: ${isData}`);
    console.log(`  Length: ${line.length}, Words: ${line.split(/\s+/).length}`);
    console.log('');
  });
  
  console.log('🔍 Testing parseTextForTables function:');
  console.log('=' .repeat(60));
  
  try {
    const tables = parseTextForTables(sampleLines, true, true);
    console.log(`Found ${tables.length} tables:`);
    
    tables.forEach((table, index) => {
      console.log(`\nTable ${index + 1}: "${table.name}"`);
      console.log(`Columns: ${table.columns}, Rows: ${table.rows.length}`);
      console.log(`Confidence: ${table.confidence}`);
      console.log('Rows:');
      table.rows.forEach((row, rowIndex) => {
        console.log(`  ${rowIndex}: [${row.join(', ')}]`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error in parseTextForTables:', error.message);
  }
  
  console.log('\n🔧 Testing table reconstruction:');
  console.log('=' .repeat(60));
  
  try {
    const reconstructedTables = await reconstructTableFromPartialData(sampleLines, true, true);
    console.log(`Reconstructed ${reconstructedTables.length} tables:`);
    
    if (reconstructedTables && reconstructedTables.length > 0) {
      reconstructedTables.forEach((table, index) => {
        console.log(`\nReconstructed Table ${index + 1}: "${table.name}"`);
        console.log(`Columns: ${table.columns}, Rows: ${table.rows.length}`);
        console.log(`Confidence: ${table.confidence}`);
        console.log('Rows:');
        table.rows.forEach((row, rowIndex) => {
          console.log(`  ${rowIndex}: [${row.join(', ')}]`);
        });
      });
    } else {
      console.log('No tables were reconstructed.');
    }
    
  } catch (error) {
    console.error('❌ Error in reconstructTableFromPartialData:', error.message);
  }
}

// Run the test
testTableDetectionLogic();
