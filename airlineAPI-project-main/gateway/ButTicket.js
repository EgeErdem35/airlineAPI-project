import http from 'k6/http';
import { check } from 'k6';

export const options = {
    vus: Number(__ENV.VUS) || 20,
    duration: __ENV.DURATION || '30s',
};

function login(baseUrl) {
    const res = http.post(
        `${baseUrl}/api/v1/auth/login`,
        JSON.stringify({
            username: __ENV.USERNAME || 'admin',
            password: __ENV.PASSWORD || 'admin123',
        }),
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    check(res, {
        'login status is 200': (r) => r.status === 200,
    });

    const body = res.json();
    return body.accessToken;
}

export default function () {
    const baseUrl = __ENV.BASE_URL;
    const token = login(baseUrl);

    const uniquePassenger = `Passenger_${__VU}_${__ITER}_${Date.now()}`;

    const payload = JSON.stringify({
        flightNumber: __ENV.FLIGHT_NUMBER || 'TK999',
        date: __ENV.FLIGHT_DATE || '2026-03-31',
        passengerNames: [uniquePassenger],
    });

    const res = http.post(
        `${baseUrl}/api/v1/flights/tickets`,
        payload,
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        }
    );

    check(res, {
        'buy ticket status is 200': (r) => r.status === 200,
    });
}