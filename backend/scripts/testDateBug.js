const d1 = new Date('2026-09-23');
console.log('ISO:', d1.toISOString());
console.log('Local getDay():', d1.getDay(), 'UTC getUTCDay():', d1.getUTCDay());
console.log('Local getDate():', d1.getDate(), 'UTC getUTCDate():', d1.getUTCDate());
console.log('toLocaleDateString id-ID:', d1.toLocaleDateString('id-ID'));

const d2 = new Date('2026-09-23T00:00:00');
console.log('Local parse ISO:', d2.toISOString());
console.log('Local parse getDay():', d2.getDay());
console.log('Local parse getDate():', d2.getDate());
