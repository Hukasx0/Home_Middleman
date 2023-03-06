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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const host = 'localhost';
const port = 1337;
const userAgent = "example";

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
let gIntervals = [];
let gClip = [];
let gNotes = [];

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
    let isPost = false;
    switch(a.type){
    case "http":
	reqd = `http://${host}:${port}/api/httpp/${a.data}`;
	break;
    case "httppost":
    reqd = `http://${host}:${port}/api/httpp/${a.data}`;
    isPost = true;
    break;
    case "https":
	reqd = `http://${host}:${port}/api/httpps/${a.data}`;
	break;
    case "httpspost":
    reqd = `http://${host}:${port}/api/httpps/${a.data}`;
    isPost = true;
    break;
    case "httptxt":
	reqd = `http://${host}:${port}/api/txt/httpp/${a.data}`;
	break;
    case "httpstxt":
	reqd = `http://${host}:${port}/api/txt/httpps/${a.data}`;
	break;
    case "scrapurl":
    reqd = `http://${host}:${port}/api/scraper/links/?link=${a.data}`;
    break;
    case "scrapimg":
    reqd = `http://${host}:${port}/api/scraper/imgs/?link=${a.data}`;
    break;
    case "cheerioc":
    reqd = `http://${host}:${port}/api/scraper/cheeriohtml/?link=${a.data}`;
    break;
    case "cclip":
    reqd = `http://${host}:${port}/api/clip/erase`;
    break;
    default:
	reqd = `http://example.com`;
    }
    if (isPost){
        let rData = a.postData;
        if (a.postType != "application/json"){
            rData = JSON.stringify(a.postData);
        }
        const purl = url.parse(reqd);
        const options = {
            host: purl.hostname,
            port: port,
            path: purl.path,
            method: 'POST',
            headers: {
                'content-type': a.postType,
                'content-length': rData.length
            }
        }
        const preq = http.request(options, (response) => {
            let data = '';
            response.on('data', (chunk) => {
                data += chunk;
            });
            response.on("end", () => {
                gTasksLog.push(data);
            });
        });
        preq.write(rData);
        preq.end();
    }
    else{
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

app.get('/notes', (req, res) => {
    fs.readFile('web/notes.html', 'utf-8', (err, data) => {
        let notes = '';
        for (let i = gNotes.length - 1; i >= 0; i--) {
            cgn = gNotes[i];
            notes += `
            <div class="card">
                <h2 class="text-center">${cgn.name}</h2>
                <div class="card-body">
                <p class="text-center">${cgn.text}</p>
                </div>
                <div class="card-body">
                    <p class="text-center">${cgn.date}</p>
                    <p role="button" style="color:blue;" onclick="getRemove('/api/notes/del/${cgn.name}')">remove note</p>
                </div>
                `; 
        }
        data = data.replace('<!-- notes -->',notes);
        res.send(data);
    });
});

app.get('/clipboard', (req, res) => {
    fs.readFile('web/clip.html', 'utf-8', (err, data) => {
        let scb = '';
        for (let i = gClip.length - 1; i >= 0; i--) {
            scb += `<li>${gClip[i]}</li>`;
        }
        data = data.replace("<!-- insert history -->", scb);
        res.send(data.replace("<!-- copyme -->",`<h1 id="copyMe" style="color: darkblue;" role="button" onclick="toClipboard()">${gClip[gClip.length-1]}</h1>`));
    });
});

app.get('/files', (req, res) => {
    fs.readFile('web/files.html', 'utf-8', (err, data) => {
        let filesL = '';
        (fs.readdirSync("upload/")).forEach((fileName) => {
            filesL += `<li><a href="api/download/${fileName}">${fileName}</a> <i class="bi bi-trash3" role="button" style="color:blueviolet;" onclick="getRemove('/api/files/del?path=${fileName}')"></i></li>`;
        });
        res.send(data.replace('<!-- insert files -->',filesL));
    });
});

app.get('/tasks', (req, res) => {
    fs.readFile('web/tasks.html', 'utf-8', (err, data) => {
        let tasks = '';
        let stasks = '';
        gTasks.forEach((t) => {
            tasks += `<li>${t.name} | ${t.type} | ${t.data} <i class="bi bi-trash3" role="button" style="color:blueviolet;" onclick="getRemove('/api/task/del/${t.name}')"></i></li>`;
            stasks += `<option value="${t.name}">${t.name}</option>`;
        });
        data = data.replace("<!-- import tasks -->", stasks);
        res.send(data.replace("<!-- tasks -->", tasks));
    });
});

app.get('/routine', (req, res) => {
    fs.readFile('web/routine.html', 'utf-8', (err, data) => {
        let intervals = '';
        let stasks = '';
        gIntervals.forEach((i) => {
            intervals += `<li>${i.name} every ${i.time/60000} minutes <i class="bi bi-calendar-x" role="button" style="color:blueviolet;" onclick="getRemove('/api/task/interval/kill/${i.id}')"></i></li>`;
        });
        gTasks.forEach((t) => {
            stasks += `<option value="${t.name}">${t.name}</option>`;
        });
        data = data.replace("<!-- import tasks -->",stasks);
        res.send(data.replace("<!-- routine -->",intervals));
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
            'User-Agent': userAgent
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

app.post('/api/httpp/*', (req, res) => {
    const rData = JSON.stringify(req.body);
    const purl = url.parse("http://"+req.params[0]);
    delete req.headers['user-agent'];
    delete req.headers['host'];
    const options = {
        hostname: purl.host,
        port: 80,
        path: purl.path,
        method: 'POST',
        headers: {
            ...req.headers,
            'user-agent': userAgent,
            'content-length': rData.length
        }
    }

    const preq = http.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => {
            data += chunk;
        });
        response.on("end", () => {
            res.send(data);
        });
    });
    preq.write(rData);
    preq.end();
});

app.post('/api/httpps/*', (req, res) => {
    const rData = JSON.stringify(req.body);
    const purl = url.parse("https://"+req.params[0]);
    delete req.headers['user-agent'];
    delete req.headers['host'];
    const options = {
        hostname: purl.host,
        port: 443,
        path: purl.path,
        method: 'POST',
        headers: {
            ...req.headers,
            'user-agent': userAgent,
            'content-length': rData.length
        }
    }

    const preq = https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => {
            data += chunk;
        });
        response.on("end", () => {
            res.send(data);
        });
    });
    preq.write(rData);
    preq.end();
});

app.get('/api/txt/httpp/*', (req, res) => {
    const npurl = "http://"+req.params[0];
    const purl = url.parse(npurl);
    const options = {
        host: purl.hostname,
        path: purl.path,
        headers: {
            'User-Agent': userAgent
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
            'User-Agent': userAgent
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
            'User-Agent': userAgent
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

app.get('/api/files/list', (req, res) => {
    let filesL = '';
    (fs.readdirSync("upload/")).forEach((fileName) => {
        filesL += `${fileName} `;
    });
    res.send(filesL);
});

app.get('/api/files/del', (req, res) => {
    fs.unlink(path.join(__dirname, `upload/${req.query.path}`), (err) => {
	res.send(`${req.query.path} removed successfully`);
    });
});

app.get('/api/files/mv', (req, res) => {
    fs.rename(path.join(__dirname, `upload/${req.query.old}`), path.join(__dirname, `upload/${req.query.new}`), (err) => {
	res.send(`${req.query.old} has been renamed to ${req.query.new}`);
    });
});

app.post('/api/write/', (req, res) => {
    const savePath = String(req.body.path);
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

app.post('/api/task/add', (req, res) => {
    const tName = String(req.body.name);
    const tType = String(req.body.type);
    const tData = String(req.body.data);
    const postType = String(req.body.pType);
    const postData = String(req.body.pData);
    gTasks.push({'name': tName, 'type': tType, 'data': tData, 'postType': postType, 'postData': postData });
    res.send(gTasks)
});
app.post('/api/task/run', (req, res) => {
    res.send(doTask(req));
});

app.get('/api/task/del/:name', (req, res) => {
    const tName = String(req.params.name);
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

app.get('/api/task/interval', (req, res) => {
    inter = '';
    gIntervals.forEach((t) => {
        inter += `${t.name} every ${t.time / 60000} minutes\n`;
    });
    res.send(inter);
});

app.post('/api/task/interval/add', (req, res) => {
    const intTime = parseInt(req.body.time, 10);
    gIntervals.push({
	'name': req.body.name,
	'id':(setInterval(() => {
	        doTask(req);
	},intTime)),
        'time': intTime}); 
    res.send("Added new interval")
});

app.get('/api/task/interval/count', (req, res) => {
    res.send("intervals: "+gIntervals.length);
});

app.get('/api/task/interval/kill/:iid', (req, res) => {
    const iid = parseInt(req.params.iid, 10);
    clearInterval(parseInt(iid));
    gIntervals = gIntervals.filter(inte => inte.id != iid);
    res.send(`interval with ${iid} id has been stopped`);
});

app.get('/api/scraper/links/', (req, res) => {
    const target = "https://"+req.query.link;
    const purl = url.parse(target);
    const options = {
        host: purl.hostname,
        path: purl.path,
        headers: {
            'User-Agent': userAgent
        }
    };
    https.get(options, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400){
            const repRedirectUrl = (response.headers.location).replace("https://", '');
            res.redirect(`http://${host}:${port}/api/scraper/links/`+repRedirectUrl);
        }
        else{
            let data = '';
        response.on('data', (chunk) => {
            data += chunk;
        });
        response.on('end', () => {
            let links = [];
            const $ = cheerio.load(data);
            $('a').each((i, el) => {
                const linkUrl = $(el).attr('href');
                links.push({ 'link': linkUrl});
              });
              fs.writeFile(path.join(__dirname, `upload/${(req.query.link).replace(/[./]/g, '_')}.json`), JSON.stringify(links, null, 2), (erro) => {
                res.send("Links scrapped successfully!");
            });
        });
        }
    });
});

app.get('/api/scraper/imgs/', (req, res) => {
    const target = "https://"+req.query.link;
    const purl = url.parse(target);
    const options = {
        host: purl.hostname,
        path: purl.path,
        headers: {
            'User-Agent': userAgent
        }
    };
    https.get(options, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400){
            const repRedirectUrl = (response.headers.location).replace("https://", '');
            res.redirect(`http://${host}:${port}/api/scraper/imgs/`+repRedirectUrl);
        }
        else{
            let data = '';
        response.on('data', (chunk) => {
            data += chunk;
        });
        response.on('end', () => {
            const $ = cheerio.load(data);
            $('img').each((i, el) => {
                let imgUrl = $(el).attr('src');
                if(imgUrl.startsWith("/")){
                    imgUrl = url.resolve(target, imgUrl);
                }
                if(!imgUrl.startsWith("https://")){
                    imgUrl = url.resolve(target,"/", imgUrl);
                }
                const filename = path.basename(imgUrl);
                const filepath = path.join(__dirname, 'upload/', filename);
                https.get(imgUrl, (res) => {
                    const fileStream = fs.createWriteStream(filepath);
                    res.pipe(fileStream);
                  });
              });
        });
        }
    });
    res.send("Images downloaded from url");
});

app.get('/api/scraper/cheeriohtml', (req, res) => {
    const target = "https://"+req.query.link;
    const elem = req.query.parse;
    const purl = url.parse(target);
    const options = {
        host: purl.hostname,
        path: purl.path,
        headers: {
            'User-Agent': userAgent
        }
    };
    https.get(options, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400){
            const repRedirectUrl = (response.headers.location).replace("https://", '');
            res.redirect(`http://${host}:${port}/api/scraper/links/`+repRedirectUrl);
        }
        else{
            let data = '';
        response.on('data', (chunk) => {
            data += chunk;
        });
        response.on('end', () => {
            let rets = [];
            const $ = cheerio.load(data);
            $(elem).each((i, el) => {
                rets += $(el).html()
              });
              fs.writeFile(path.join(__dirname, `upload/${(req.query.link).replace(/[./]/g, '_')}.html`), rets, (erro) => {
                res.send(`${elem} scrapped successfully!`);
            });
        });
        }
    });
});

app.get('/api/clip', (req, res) => {
    res.send(gClip[gClip.length-1]);
});

app.post('/api/clip/save', (req, res) => {
    gClip.push(req.body.data);
    res.send('data saved to clip');
});

app.get('/api/clip/history', (req, res) => {
    res.send(gClip);
});

app.get('/api/clip/erase', (req, res) => {
    gClip = [];
    res.send('Clipboard erased');
});

app.get('/api/notes', (req, res) => {
    res.send(gNotes);
});

app.post('/api/notes/add', (req, res) => {
    gNotes.push({
	'name': req.body.name,
	'text': req.body.text,
	'date': req.body.date
    });
    res.send(`'${req.body.name}' note added`);
});

app.get('/api/notes/del/:name', (req, res) => {
    const noteName = String(req.params.name);
    gNotes = gNotes.filter(ob => ob.name !== noteName);
    res.send(`${noteName} removed`);
});

app.listen(port, () => {
    console.log(`server is running on port http://${host}:${port}/`);
});
