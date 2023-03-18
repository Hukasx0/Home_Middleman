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
let {uFiles, uSize} = getFilesAndSize();

setInterval(() => {
    const gfas = getFilesAndSize();
    uFiles = gfas.uFiles;
    uSize = gfas.uSize;
  }, 300000);

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

function dirRecursively(cdir, rPath = ''){
    const files = fs.readdirSync(cdir);
    let ret = [];
    files.forEach(file => {
        const fPath = path.join(cdir, file);
        const stat = fs.statSync(fPath);
        if (stat.isDirectory()){
            ret = ret.concat(dirRecursively(fPath, path.join(rPath, file)));
        }
        else{
            ret.push(path.join(rPath, file).replace(/\\/g, '/'));
        }
    });
    return ret;
}

function fileById(folder, id){
    const files = fs.readdirSync(path.join(__dirname, 'upload/', folder));
    return files[id] !== undefined ? fs.statSync(path.join(__dirname, 'upload/', files[id])).isFile() ? files[id] : "" : "";
}

function getHour(){
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}_${minutes}`;
}

function getDate(){
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const year = now.getFullYear().toString();
    return `${day}_${month}_${year}`;
}

function getFilesAndSize(){
    let fnum = 0;
    let fSize = 0;
    const files = fs.readdirSync(path.join(__dirname, 'upload/'));
    files.forEach((f) => {
        const filePath = path.join(__dirname, 'upload/', f);
        const stats = fs.statSync(filePath);
        if (stats.isFile()){
            fnum++;
            fSize += stats.size;
        }
    });
    const fSizeMB = (fSize / (1024 * 1024)).toFixed(2);
    return {
        uFiles: fnum,
        uSize: fSizeMB
    };
}

function getLine(fileName, id){
    const lines = fs.readFileSync(path.join(__dirname, 'upload/', fileName), 'utf-8').split("\n");
    return lines[id] !== undefined ? lines[id] : "";
}

function getWord(fileName, id){
    const words = fs.readFileSync(path.join(__dirname, 'upload/', fileName), 'utf-8').split(" ");
    return words[id] !== undefined ? words[id] : "";
}

function alwaysArr(value) {
    if (Array.isArray(value)) {
      return value;
    } else {
      return [value];
    }
  }

function doTask(req){
    const tName = String(req.body.name);
    let a = gTasks.find(ob => ob.name == tName);
    let reqd = '';
    let isPost = false;
    const data = a.data.replace('~hour~',getHour()).replace("~date~",getDate()).replace(/~inc\$(\d+)~/, (m, p) => parseInt(p))
                .replace(/~dec\$(\d+)~/, (m, p) => parseInt(p))
                .replace(/~{([^}]*)}~/g, (match, contents) => {return contents.split(' ')[0]})
                .replace(/~(\d+)\s*\+\s*(\d+)~/, (match, co1, co2) => {return co1})
                .replace(/~(\d+)\s*\-\s*(\d+)~/, (match, co1, co2) => {return co1})
                .replace(/~files\s+(\S+)\s+(\d+)~/, (match, co1, co2) => {return fileById(co1, co2)})
                .replace(/~lines\s+(.+?)\s+(\d+)~/, (match, co1, co2) => {return getLine(co1, co2)})
                .replace(/~words\s+(.+?)\s+(\d+)~/, (match, co1, co2) => {return getWord(co1, co2)});
    const postData = a.postData.replace('~hour~',getHour()).replace("~date~",getDate()).replace(/~inc\$(\d+)~/, (m, p) => parseInt(p))
                .replace(/~dec\$(\d+)~/, (m, p) => parseInt(p))
                .replace(/~{([^}]*)}~/g, (match, contents) => {return contents.split(' ')[0]})
                .replace(/~(\d+)\s*\+\s*(\d+)~/, (match, co1, co2) => {return co1})
                .replace(/~(\d+)\s*\-\s*(\d+)~/, (match, co1, co2) => {return co1})
                .replace(/~files\s+(\S+)\s+(\d+)~/, (match, co1, co2) => {return fileById(co1, co2)})
                .replace(/~lines\s+(.+?)\s+(\d+)~/, (match, co1, co2) => {return getLine(co1, co2)})
                .replace(/~words\s+(.+?)\s+(\d+)~/, (match, co1, co2) => {return getWord(co1, co2)});
    a.data = a.data.replace(/~inc\$(\d+)~/, (m, p) => "~inc$"+(parseInt(p)+1)+"~")
            .replace(/~dec\$(\d+)~/, (m, p) => "~dec$"+(parseInt(p)-1)+"~")
            .replace(/~{([^}]*)}~/g, (match, contents) => {return '~{' + (contents.split(' ')).slice(1).join(' ') + ` ${(contents.split(' ')).slice(0,1)}` + '}~'})
            .replace(/~(\d+)\s*\+\s*(\d+)~/, (match, co1, co2) => {return "~"+(parseInt(co1)+parseInt(co2))+" + "+co2+"~"})
            .replace(/~(\d+)\s*\-\s*(\d+)~/, (match, co1, co2) => {return "~"+(parseInt(co1)-parseInt(co2))+" - "+co2+"~"})
            .replace(/~files\s+(\S+)\s+(\d+)~/, (match, co1, co2) => {return `~files ${co1} ${parseInt(co2) + 1}~`})
            .replace(/~lines\s+(.+?)\s+(\d+)~/, (match, co1, co2) => {return `~lines ${co1} ${parseInt(co2)+1}~`})
            .replace(/~words\s+(.+?)\s+(\d+)~/, (match, co1, co2) => {return `~words ${co1} ${parseInt(co2)+1}~`});
    a.postData = a.postData.replace(/~inc\$(\d+)~/, (m, p) => "~inc$"+(parseInt(p)+1)+"~")
            .replace(/~dec\$(\d+)~/, (m, p) => "~dec$"+(parseInt(p)-1)+"~")
            .replace(/~{([^}]*)}~/g, (match, contents) => {return '~{' + (contents.split(' ')).slice(1).join(' ')  + ` ${(contents.split(' ')).slice(0,1)}` + '}~'})
            .replace(/~(\d+)\s*\+\s*(\d+)~/, (match, co1, co2) => {return "~"+(parseInt(co1)+parseInt(co2))+" + "+co2+"~"})
            .replace(/~(\d+)\s*\-\s*(\d+)~/, (match, co1, co2) => {return "~"+(parseInt(co1)-parseInt(co2))+" - "+co2+"~"})
            .replace(/~files\s+(\S+)\s+(\d+)~/, (match, co1, co2) => {return `~files ${co1} ${parseInt(co2) + 1}~`})
            .replace(/~lines\s+(.+?)\s+(\d+)~/, (match, co1, co2) => {return `~lines ${co1} ${parseInt(co2)+1}~`})
            .replace(/~words\s+(.+?)\s+(\d+)~/, (match, co1, co2) => {return `~words ${co1} ${parseInt(co2)+1}~`});
    switch(a.type){
    case "http":
	    reqd = `http://${host}:${port}/api/httpp/${data}`;
	    break;
    case "httppost":
        reqd = `http://${host}:${port}/api/httpp/${data}`;
        isPost = true;
        break;
    case "https":
	    reqd = `http://${host}:${port}/api/httpps/${data}`;
	    break;
    case "httpspost":
        reqd = `http://${host}:${port}/api/httpps/${data}`;
        isPost = true;
        break;
    case "httptxt":
	    reqd = `http://${host}:${port}/api/txt/httpp/${data}`;
	    break;
    case "httpstxt":
	    reqd = `http://${host}:${port}/api/txt/httpps/${data}`;
	    break;
    case "scrapurl":
        reqd = `http://${host}:${port}/api/scraper/links/?link=${data}`;
        break;
    case "scrapimg":
        reqd = `http://${host}:${port}/api/scraper/imgs/?link=${data}`;
        break;
    case "cheerioc":
        reqd = `http://${host}:${port}/api/scraper/cheeriohtml/?link=${data}`;
        break;
    case "scraprss":
        reqd = `http://${host}:${port}/api/scraper/rss?link=${data}`;
        break;
    case "cclip":
        reqd = `http://${host}:${port}/api/clip/erase`;
        break;
    case "delfile":
        reqd = `http://${host}:${port}/api/files/del?path=${data}`;
        break;
    case "mvfile":
        reqd = `http://${host}:${port}/api/files/mv${data}`;
        break;
    case "uploadlink":
        reqd = `http://${host}:${port}/api/uploadLink`;
        isPost = true;
        break;
    case "saveclip":
        reqd = `http://${host}:${port}/api/clip/save`;
        isPost = true;
        break;
    case "logfile":
        reqd = `http://${host}:${port}/api/task/log/toFile?name=${data}`;
        break;
    case "cfgimport":
        reqd = `http://${host}:${port}/api/cfg/import?path=${data}`;
        break;
    case "cfgexport":
        reqd = `http://${host}:${port}/api/cfg/export?name=${data}`;
        break;
    case "consoleget":
        reqd = `http://${host}:${port}/api/console?text=${data}`;
        break;
    case "consolepost":
        reqd = `http://${host}:${port}/api/console`;
        isPost = true;
        break;
    case "sendfile":
        reqd = `http://${host}:${port}/api/files/send${data}`;
        break;
    case "reload":
        reqd = `http://${host}:${port}/api/reload?cfg=${data}`;
        break;
    default:
	reqd = `http://example.com`;
    }
    if (isPost){
        let rData = postData;
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
        data = data.replace("<!-- additional info -->", `
        <h3 class="lead">saved tasks: <b>${gTasks.length}</b></h3>
        <h3 class="lead">tasks running in routine <b>${gIntervals.length}</b></h3>
        <h3 class="lead">executed tasks: <b>${gTasksLog.length}</b></h3>
        <h3 class="lead">snippets in clipboard: <b>${gClip.length}</b></h3>
        <h3 class="lead">saved notes: <b>${gNotes.length}</b></h3>
        <h3 class="lead">'upload/' folder has <b>${uFiles}</b> files which together use <b>${uSize} MB</b> of memory</h3>
        <h3 class="lead">server is currently using <b>${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB</b> ram</h3>
        `);
        res.send(data);
    });
});

app.get('/proxy', (req, res) => {
    fs.readFile('web/proxy.html', 'utf-8', (err, data) => {
        res.send(data);
    });
});

app.get('/get/pythonClient', (req, res) => {
    res.download(path.join(__dirname, 'client/hmmClient.py'));
});

app.get('/get/pdfDocs', (req, res) => {
    res.download(path.join(__dirname, 'docs/HomeMiddleman_api.pdf'));
});

app.get('/get/texDocs', (req, res) => {
    res.download(path.join(__dirname, 'docs/HomeMiddleman_api.tex'));
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
        let filesOp = '';
        dirRecursively("upload/").forEach((fileName) => {
            filesL += `<li><a href="api/download/${fileName}">${fileName}</a> <i class="bi bi-trash3" role="button" style="color:blueviolet;" onclick="getRemove('/api/files/del?path=${fileName}')"></i></li>`;
            filesOp += `<option value="${fileName}">${fileName}</option>`;
        });
        data = data.replace("<!-- files options -->",filesOp);
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

app.get('/api/cfg/import', (req, res) => {
    fs.readFile(path.join(__dirname, 'upload/', req.query.path), (err, jsoncfg) => {
    jsoncfg = JSON.parse(jsoncfg);
    jsoncfg.forEach((i) => {
	switch (i.type){
	case "task":
	    gTasks.push({
		'name': i.data.name,
		'type': i.data.type,
		'data': i.data.data,
		'postType': i.data.postType,
		'postData': i.data.postData
	    });
	    break;
	case "routine":
	    gIntervals.push({
		'name': i.data.name,
		'id': (setInterval(() => {
            let r = req;
            r.body.name = i.data.name;
		    doTask(r);
		},i.data.time)),
		'time': i.data.time
	    });
	default:
	    break;
	}
    });
    });
    	res.send(`Config ${req.query.path} loaded`);
});

app.get('/api/cfg/export', (req, res) => {
    let toJson = [];
    gTasks.forEach((e) => {
	toJson.push({
	    'type': 'task',
	    'data': e
	});
    });
    gIntervals.forEach((e) => {
	toJson.push({
	    'type': 'routine',
	    'data': {'name': e.name,
		     'time': e.time}
	});
    });
    const fName = `${req.query.name}.json`;
    fs.writeFile(path.join(__dirname, `upload/`, fName), JSON.stringify(toJson, null, 2), (erro) => {
	res.send(`Config exported successfully to ${fName}`);
    });
});

app.get('/api/restart', (req, res) => {
    gTasks = [];
    gTasksLog = [];
    gIntervals = [];
    gClip = [];
    gNotes = [];
    res.send("Home middleman has been restarted");
});

app.get('/api/reload', (req, res) => {
    gTasks = [];
    gTasksLog = [];
    gIntervals = [];
    gClip = [];
    gNotes = [];
    fs.readFile(path.join(__dirname, 'upload/', req.query.cfg), (err, jsoncfg) => {
        jsoncfg = JSON.parse(jsoncfg);
        jsoncfg.forEach((i) => {
        switch (i.type){
        case "task":
            gTasks.push({
            'name': i.data.name,
            'type': i.data.type,
            'data': i.data.data,
            'postType': i.data.postType,
            'postData': i.data.postData
            });
            break;
        case "routine":
            gIntervals.push({
            'name': i.data.name,
            'id': (setInterval(() => {
                let r = req;
                r.body.name = i.data.name;
                doTask(r);
            },i.data.time)),
            'time': i.data.time
            });
        default:
            break;
        }
        });
        });
    res.send(`Restarted Home Middleman and loaded ${req.query.cfg} config`);
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

app.get('/api/download/*', (req, res) => {
    const fileName = req.params[0];
    res.sendFile(path.join(__dirname, 'upload/'+fileName));
});

app.get('/api/files/list', (req, res) => {
    let filesL = '';
    dirRecursively("upload/").forEach((filename) => {
        filesL += `${filename} `;
    });
    res.send(filesL);
});

app.get('/api/files/del', (req, res) => {
    fs.unlink(path.join(__dirname, `upload/${req.query.path}`), (err) => {
	res.send(`${req.query.path} removed successfully`);
    });
});

app.get('/api/files/mv', (req, res) => {
    const dirName = path.dirname(path.join(__dirname, `upload/${req.query.new}`));
    fs.mkdir(dirName, { recursive: true }, (err) => {
        fs.rename(path.join(__dirname, `upload/${req.query.old}`), path.join(__dirname, `upload/${req.query.new}`), (err) => {
	        res.send(`${req.query.old} has been renamed to ${req.query.new}`);
        });
    });
});

app.get('/api/files/send', (req, res) => {
    const file = fs.readFileSync(path.join(__dirname, 'upload/', req.query.path));
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
            'Content-Length': file.length
        }
    };
    const preq = http.request(req.query.target, options, (pres) => {
        let data = '';
        pres.on('data', (chunk) => {
            data += chunk;
          });
        pres.on('end', () => {
            res.send(data);
          });
    });
    preq.write(file);
    preq.end();
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

app.get('/api/task/log/toFile', (req, res) => {
    fs.writeFile(path.join(__dirname, `upload/${req.query.name}}.json`), JSON.stringify(gTasksLog, null, 2), (erro) => {
	    res.send("Log saved to file successfully!");
	});
});

app.get('/api/task/log/clear', (req, res) => {
    gTasksLog = [];
    res.send("Tasks log cleared!");
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
              const dirName = path.join(__dirname, 'upload/', req.query.path);
              fs.mkdir(dirName, { recursive: true }, (err) => {
              fs.writeFile(path.join(__dirname, `upload/${req.query.path}${(req.query.link).replace(/[./]/g, '_')}.json`), JSON.stringify(links, null, 2), (erro) => {
                res.send("Links scrapped successfully!");
            });
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
            const dirName = path.join(__dirname, 'upload/', req.query.path);
            fs.mkdir(dirName, { recursive: true }, (err) => {
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
                const filepath = path.join(__dirname, `upload/${req.query.path}`, filename);
                https.get(imgUrl, (res) => {
                    const fileStream = fs.createWriteStream(filepath);
                    res.pipe(fileStream);
                  });
              });
        });
        }
        )};
    });
    res.send("Images downloaded from url");
});

app.get('/api/scraper/cheeriohtml', (req, res) => {
    const target = "https://"+req.query.link;
    const elem = alwaysArr(req.query.parse);
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
            elem.forEach((m) => {
                const $ = cheerio.load(data);
                $(m).each((i, el) => {
                    rets += $(el).html()
                });
            });
              const dirName = path.dirname(path.join(__dirname, `upload/${req.query.path}`));
              fs.mkdir(dirName, { recursive: true }, (err) => {
              const dirName = path.join(__dirname, 'upload/', req.query.path);
              fs.mkdir(dirName, { recursive: true }, (err) => {
              fs.writeFile(path.join(__dirname, `upload/${req.query.path}${(purl.hostname).replace(/[./]/g, '_')}.html`), rets, (erro) => {
                res.send(`html tags scrapped successfully!`);
            });
        });
        });
        });
        }
    });
});

app.get('/api/scraper/rss', (req, res) => {
    const target = "https://"+req.query.link;
    const elem = alwaysArr(req.query.parse);
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
            let tags = '';
            elem.forEach((m) => {
                const $ = new RegExp(`<${m}>([\\s\\S]*?)<\\/${m}>`, "g");
                let tagm;
                while ((tagm = $.exec(data))){
                    tags += `${tagm[1]}\n`;
                }
            });
              const dirName = path.dirname(path.join(__dirname, `upload/${req.query.path}`));
              fs.mkdir(dirName, { recursive: true }, (err) => {
              const dirName = path.join(__dirname, 'upload/', req.query.path);
              fs.mkdir(dirName, { recursive: true }, (err) => {
              fs.writeFile(path.join(__dirname, `upload/${req.query.path}${(purl.hostname).replace(/[./]/g, '_')}.txt`), tags, (erro) => {
                res.send(`rss scrapped successfully!`);
            });
        });
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

app.get('/api/console', (req, res) => {
    console.log(req.query.text);
    res.send(`${req.query.text} was printed in the server console`);
});

app.post('/api/console', (req, res) => {
    console.log(req.body.text);
    res.send(`${req.body.text} was printed in the server console`);
});

app.listen(port, () => {
    console.log(`server is running on port http://${host}:${port}/`);
});
