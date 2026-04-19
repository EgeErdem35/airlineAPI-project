const https = require('http');

async function insertData() {
    const loginData = JSON.stringify({ username: 'admin', password: 'admin123' });

    console.log("Logging in...");
    const token = await new Promise((resolve, reject) => {
        const req = https.request('http://localhost:5000/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': loginData.length
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const parsed = JSON.parse(data);
                if (parsed.accessToken) resolve(parsed.accessToken);
                else reject('No token ' + data);
            });
        });
        req.on('error', reject);
        req.write(loginData);
        req.end();
    });

    console.log("Got token!");

    const flights = [
        {
            flightNumber: 'TK1523',
            departureDateTime: new Date().toISOString().split('T')[0] + 'T08:00:00',
            arrivalDateTime: new Date().toISOString().split('T')[0] + 'T10:00:00',
            airportFrom: 'IST',
            airportTo: 'FRA',
            duration: 120,
            capacity: 150
        },
        {
            flightNumber: 'TK1524',
            departureDateTime: new Date(Date.now() + 86400000).toISOString().split('T')[0] + 'T21:00:00',
            arrivalDateTime: new Date(Date.now() + 86400000).toISOString().split('T')[0] + 'T23:30:00',
            airportFrom: 'FRA',
            airportTo: 'IST',
            duration: 150,
            capacity: 150
        },
        {
            flightNumber: 'GS1905',
            departureDateTime: new Date().toISOString().split('T')[0] + 'T14:30:00',
            arrivalDateTime: new Date().toISOString().split('T')[0] + 'T15:45:00',
            airportFrom: 'IST',
            airportTo: 'AYT',
            duration: 75,
            capacity: 200
        }
    ];

    for (const flight of flights) {
        const payload = JSON.stringify(flight);
        await new Promise((resolve) => {
            const req = https.request('http://localhost:5000/api/v1/flights', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Content-Length': payload.length
                }
            }, (res) => {
                let data = '';
                res.on('data', d => data += d);
                res.on('end', () => {
                    console.log(`Flight ${flight.flightNumber} added, code ${res.statusCode}`);
                    resolve();
                });
            });
            req.write(payload);
            req.end();
        });
    }
}

insertData().catch(console.error);
