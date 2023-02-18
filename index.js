const express = require('express');
const multer = require('multer');
const path = require('path');
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

const host = 'localhost';
const port = 1337;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'upload/');
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
}); const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    fs.readFile('web/index.html', 'utf-8', (err, data) => {
        res.send(data);
    });
});

app.get('/proxy', (req, res) => {
    fs.readFile('web/proxy.html', 'utf-8', (err, data) => {
        res.send(data);
    });
});

app.get('/files', (req, res) => {
    fs.readFile('web/files.html', 'utf-8', (err, data) => {
        let filesL = '';
        (fs.readdirSync("upload/")).forEach((fileName) => {
            filesL += `<li><a href="api/download/${fileName}">${fileName}</a></li>`;
        });
        res.send(data.replace('<!-- insert files -->',filesL));
    });
});

app.get('/api', (req, res) => {
    fs.readFile('web/api.html', 'utf-8', (err, data) => {
        res.send(data);
    });
});


app.get('/css/main.css', (req, res) => {
    fs.readFile('web/css/main.css', 'utf-8', (err, data) => {
        res.writeHead(200, { 'Content-Type': 'text/css'});
        res.write(data);
        res.end();
    });
});

app.get('/js/main.js', (req, res) => {
    fs.readFile('web/js/main.js', 'utf-8', (err, data) => {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.write(data);
        res.end();
    });
});

app.get('/api/httpp/*', (req, res) => {
    const npurl = "http://"+req.params[0];
    const purl = url.parse(npurl);
    const options = {
        host: purl.hostname,
        path: purl.path,
        headers: {
            'User-Agent': 'example'
        }
    };
    http.get(options, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400){
            const repRedirectUrl = (response.headers.location).replace("http://", '');
            res.redirect(`http://${host}:${port}/api/httpp/`+repRedirectUrl);
        }
        else{
            let data = '';
            response.on('data', (chunk) => {
                data+=chunk;
            });
            response.on('end', () => {
                res.send(data);
            });
        }
    });
});

app.get('/api/httpps/*', (req, res) => {
    const npurl = "https://"+req.params[0];
    const purl = url.parse(npurl);
    const options = {
        host: purl.hostname,
        path: purl.path,
        headers: {
            'User-Agent': 'example'
        }
    };
    https.get(options, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400){
            const repRedirectUrl = (response.headers.location).replace("https://", '');
            res.redirect(`http://${host}:${port}/api/httpps/`+repRedirectUrl);
        }
        else{
            let data = '';
        response.on('data', (chunk) => {
            data += chunk;
        });
        response.on('end', () => {
            res.send(data);
        });
        }
    });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
    // curl -X POST -F "file=@example.txt" http://localhost:1337/upload
    if(!req.file){
        res.status(400).send("No file specified");
    }
    else{
        res.status(200).send("File uploaded successfully");
    }
});

app.post('/api/uploadLink', (req, res) => {
    // curl --header "Content-Type: application/x-www-form-urlencoded" --request POST --data "link=https://example.com/image.png" http://localhost:1337/api/uploadLink
    const fileLink = req.body.link;
    if (!fileLink) {
        res.status(400).send("No file url specified");
    }
    else{
        const fName = fileLink.substring(fileLink.lastIndexOf('/')+1);
        const f = fs.createWriteStream(`upload/${fName}`);
        https.get(fileLink, (response) => {
            response.pipe(f).on('close', () => {
                res.status(200).send("File downloaded successfully from provided link");
            });
        });
    }
});

app.get('/api/download/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    res.sendFile(path.join(__dirname, 'upload/'+fileName));
});

app.listen(port, () => {
    console.log(`server is running on port http://${host}:${port}/`);
});