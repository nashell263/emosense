const { getDb } = require('./server/database.cjs');
const bcrypt = require('bcryptjs');

async function debugLogin() {
    try {
        console.log('--- DB Debug ---');
        const db = getDb();
        const email = 'tendai.moyo@msu.ac.zw';
        const password = 'counselor123';

        const counselor = db.prepare('SELECT * FROM counselors WHERE email = ?').get(email);

        if (!counselor) {
            console.log('Error: Counselor not found in DB!');
            const all = db.prepare('SELECT email FROM counselors').all();
            console.log('All available emails:', all);
            return;
        }

        console.log('Counselor found:', counselor.name);

        const match = bcrypt.compareSync(password, counselor.password);
        console.log('Password match:', match);

        if (!match) {
            console.log('Hash in DB:', counselor.password);
            console.log('New hash for test:', bcrypt.hashSync(password, 10));
        }

    } catch (err) {
        console.error('Debug Error:', err);
    }
}

debugLogin();
