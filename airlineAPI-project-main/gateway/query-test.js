import http from 'k6/http';
import { check } from 'k6';

export const options = {
    vus: Number(__ENV.VUS) || 20,
    duration: __ENV.DURATION || '30s',
};

export default function () {
    const url =
        `${__ENV.BASE_URL}/api/v1/flights/query` +
        `?dateFrom=2026-03-30` +
        `&dateTo=2026-03-31` +
        `&airportFrom=ADB` +
        `&airportTo=IST` +
        `&numberOfPeople=1` +
        `&tripType=one-way`;

    const res = http.get(url);

    check(res, {
        'query status is 200': (r) => r.status === 200,
    });
}