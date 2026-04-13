const http = require('http');
const fs = require('fs');

const payload = JSON.stringify({
    profileData: {
        fullName: "Алексей Иванов",
        skills: ["React", "TypeScript", "HTML", "CSS"],
        experienceYears: 1,
        desiredPosition: "Junior Frontend Developer",
        aboutMe: "Студент, делал пет-проекты на React."
    },
    topVacancies: 1
});

const req = http.request('http://localhost:3002/ai/poc/run', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        fs.writeFileSync('demo-resume.json', JSON.stringify(JSON.parse(data).data.resume, null, 2));
        console.log('Saved to demo-resume.json');
    });
});

req.on('error', console.error);
req.write(payload);
req.end();
