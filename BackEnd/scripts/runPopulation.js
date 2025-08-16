const populateInterviewData = require('./populateInterviewData');

console.log('🚀 Starting interview data population...');
populateInterviewData()
  .then(() => {
    console.log('✅ Data population completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error during data population:', error);
    process.exit(1);
  }); 