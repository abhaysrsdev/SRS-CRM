import xlsx from 'xlsx';
import fs from 'fs';

try {
  const buf = fs.readFileSync('Ledger Details.xlsx');
  const workbook = xlsx.read(buf, { type: 'buffer' });
  console.log('Sheet Names:', workbook.SheetNames);
  
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const data = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
  
  console.log(`Total rows in ${firstSheetName}: ${data.length}`);
  console.log('First 5 rows:');
  console.log(JSON.stringify(data.slice(0, 5), null, 2));

  // Save the full json to a file so we can view it
  fs.writeFileSync('ledger_data.json', JSON.stringify(data, null, 2));
  console.log('Saved to ledger_data.json');
} catch (error) {
  console.error('Error reading excel file:', error);
}
