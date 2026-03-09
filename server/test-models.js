const API_KEY = 'AIzaSyDH7sn-LNZJvKv_HBS9XOA0UZvS2vOzTOc';

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
        if (data.models) {
            console.log("Allowed Models:");
            data.models.forEach(m => console.log(m.name));
        } else {
            console.log(JSON.stringify(data, null, 2));
        }
    })
    .catch(err => console.error(err));
