const fs = require('fs');

const data = JSON.parse(fs.readFileSync('questions_seed.json', 'utf8'));
const counts = {};
data.forEach(q => {
  const s = q.subject;
  counts[s] = (counts[s] || 0) + 1;
});

console.log('Total:', data.length);
console.log(JSON.stringify(counts, null, 2));

// Check missing IDs
const bySubject = {};
data.forEach(q => {
  if (!bySubject[q.subject]) bySubject[q.subject] = [];
  bySubject[q.subject].push(q.id);
});

console.log('\nSubject ID samples and ranges:');
for (const [sub, ids] of Object.entries(bySubject)) {
  console.log(`${sub}: count=${ids.length}, first=${ids[0]}, last=${ids[ids.length - 1]}`);
}
