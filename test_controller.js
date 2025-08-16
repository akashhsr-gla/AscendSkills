const controller = require('./controllers/codingController');

console.log('Available functions:');
console.log(Object.keys(controller));

console.log('\nChecking specific functions:');
console.log('executeCode:', typeof controller.executeCode);
console.log('submitCode:', typeof controller.submitCode);
console.log('validateCode:', typeof controller.validateCode); 