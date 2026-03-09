const API_KEY = 'AIzaSyDH7sn-LNZJvKv_HBS9XOA0UZvS2vOzTOc';
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        contents: [{ parts: [{ text: "Explain how AI works" }] }]
    })
})
    .then(res => res.json())
    .then(data => console.log(data.candidates ? "SUCCESS!" : JSON.stringify(data, null, 2)))
    .catch(err => console.error(err));
