const express = require('express');
const multer = require('multer');
const path = require('path');
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const bodyParser = require('body-parser');
const cheerio = require('cheerio');
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

let gTasks = [];
let gTasksLog = [];

function html2txt(html) {
    const $ = cheerio.load(html);
    $('a').each((i, el) => {
        const linkText = $(el).text();
        const linkUrl = $(el).attr('href');
        const linkFormattedText = `~~~ ${linkText} => ${linkUrl} ~~~`;
        $(el).text(linkFormattedText);
      });
    const imgs = $('<p>').text(`\n*** ${$('img').attr('alt')} => ${$('img').attr('src')} ***\n`);
    $('img').replaceWith(imgs);
    $('script, style').remove();
    const title = $('title').text();
    const body = ($('body').text()).replace(/\n+/g, '\n');
    return `title: \t\t${title}
    ${body}`;
}

function doTask(req){
    const tName = String(req.body.name);
    let a = gTasks.find(ob => ob.name == tName);
    let reqd = '';
    switch(a.type){
    case "http":
	reqd = `http://${host}:${port}/api/httpp/${a.data}`;
	break;
    case "https":
	reqd = `http://${host}:${port}/api/httpps/${a.data}`;
	break;
    case "httptxt":
	reqd = `http://${host}:${port}/api/txt/httpp/${a.data}`;
	break;
    case "httpstxt":
	reqd = `http://${host}:${port}/api/txt/httpps/${a.data}`;
	break;
    default:
	reqd = 'http://example.com';
    }
    let rdata = '';
    http.get(reqd, (response) => {
	let data = '';
	response.on('data', (chunk) => {
	    data += chunk;
	});
	response.on('end', () =>{
	    gTasksLog.push(data);
	});
    });
 }

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

app.get('/api/txt/httpp/*', (req, res) => {
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
            res.redirect(`http://${host}:${port}/api/txt/httpp/`+repRedirectUrl);
        }
        else{
            let data = '';
            response.on('data', (chunk) => {
                data+=chunk;
            });
            response.on('end', () => {
                res.send(html2txt(data));
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

app.get('/api/txt/httpps/*', (req, res) => {
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
            res.redirect(`http://${host}:${port}/api/txt/httpps/`+repRedirectUrl);
        }
        else{
            let data = '';
        response.on('data', (chunk) => {
            data += chunk;
        });
        response.on('end', () => {
            res.send(html2txt(data));
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

app.post('/api/write/:path', (req, res) => {
    const savePath = String(req.params.path);
    const fileName = String(req.body.name);
    if(!fileName){
	res.send("No name specified");
    }
    const fileData = String(req.body.data);
    if(!fileData){
	res.send("No data specified");
    }
    fs.mkdir(path.join(__dirname, `upload/${savePath}`), {recursive: true}, (err) => {
	fs.writeFile(path.join(__dirname, `upload/${savePath}/${fileName}`), fileData, (erro) => {
	    res.send("File created successfully!");
	});
    });
});

app.post('/api/parse/html/tag', (req, res) =>{
    const txt = String(req.body.data);
    const pType = String(req.body.pType);
    const $ = cheerio.load(txt);
    console.log(txt);
    console.log(pType);
    let ret = [];
    $(pType).each((i, el) => {
	ret.push($(el).text());
    });
    res.send(ret);
});

app.post('/api/parse/html/byid', (req, res) => {
    const txt = String(req.body.data);
    const hid = String(req.body.id);
    const $ = cheerio.load(txt);
    res.send($("#"+hid).text());
});

app.post('/api/parse/html/byclass', (req, res) => {
    const txt = String(req.body.data);
    const hcl = String(req.body.class);
    const $ = cheerio.load(txt);
    let ret = [];
    $("."+hcl).each((e, el) => {
	ret.push($(el).text());
    });
    res.send(ret);
});

app.post('/api/task/add', (req, res) => {
    const tName = String(req.body.name);
    const tType = String(req.body.type);
    const tData = String(req.body.data);
    gTasks.push({'name': tName, 'type': tType, 'data': tData });
    res.send(gTasks)
});
app.post('/api/task/run', (req, res) => {
    res.send(doTask(req));
});

app.post('/api/task/del', (req, res) => {
    const tName = String(req.body.name);
    gTasks = gTasks.filter(ob => ob.name !== tName);
    res.send(`Task with name ${tName} has been removed`);
});

app.post('/api/task/time/run', (req, res) => {
    const tTime = parseInt(req.body.time, 10);
    setTimeout(() => {
	doTask(req);
    },tTime)
    res.send("Time task started");
});

app.get('/api/task', (req, res) => {
    res.send(gTasks);
});

app.get('/api/task/log/', (req, res) => {
    res.send({'return': gTasksLog});
});

app.get('/api/task/count', (req, res) => {
    res.send("logs: "+(gTasksLog.length));
});

app.get('/api/task/log/:logid', (req, res) => {
    if(String(req.params.logid) == "n"){
	res.send(gTasksLog[gTasksLog.length-1]);
    }
    else{
    const logid = parseInt(req.params.logid);
	res.send(gTasksLog[logid]);
    }
});

app.listen(port, () => {
    console.log(`server is running on port http://${host}:${port}/`);
});
