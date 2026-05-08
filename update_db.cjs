const db = require('better-sqlite3')('emosense_v4.db');
db.prepare("UPDATE counselors SET gender='female', photo='/counselors/counselor-3.png' WHERE name='Tendai Moyo'").run();
db.prepare("UPDATE counselors SET gender='male', photo='/counselors/counselor-1.png' WHERE name='Rutendo Mhaka'").run();
console.log('DB Updated!');
