const mainSite = "http://"+ window.location.hostname + ":" + window.location.port

function guiProxy(){
    const protocol = document.getElementById('protocol');
    const target = document.getElementById('target');
    const iFrame = document.getElementById('fr');
    if (protocol.value == "1"){
        const req = mainSite+"/api/httpps/"+target.value;
        console.log(req);
        iFrame.src = req
    }
    else{
        const req = mainSite+"/api/httpp/"+target.value;
        console.log(req);
        iFrame.src = req
    }
}

function guiUpload(){
    const fileInput = document.getElementById('fUpload').files[0];
    if(!fileInput){
        alert("No file specified");
        return;
    }
    const formData = new FormData();
    formData.append('file', fileInput);
    fetch('/api/upload', {
        method: 'POST',
        body: formData
    }).then(response => response.text())
    .then(result => {
        document.location.reload(true);
    }).catch(error => {
        alert(error);
    });
}

function guiLinkUpload(){
    const fileLink = document.getElementById('fLink').value;
    if(!fileLink){
        alert("No file link specified");
        return
    }
    fetch('/api/uploadLink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `link=${encodeURIComponent(fileLink)}`
    }).then(response => response.text())
    .then(result => {
        document.location.reload(true);
    }).catch(error => {
        alert(error);
    });
}

function newTask(){
    const tName = document.getElementById('tName').value.replace("?","%3F").replace("&", "%26");
    const tType = document.getElementById('tType').value;
    let tData = document.getElementById('tData').value.replace("?","%3F").replace("&", "%26");
    let pType = document.getElementById('pType').value;
    let pData = document.getElementById('pData').value;
    const tData2 = document.getElementById('tData2').value;
    const sPath = document.getElementById('path').value;
    switch (tType) {
        case "cheerioc":
            tData += `${manyParsers(tData2)}&path=${sPath}`;
            break;
        case "scraprss":
            tData += `${manyParsers(tData2)}&path=${sPath}`;
            break;
        case "scrapurl":
            tData += `&path=${sPath}`;
            break;
        case "scrapimg":
            tData += `&path=${sPath}`;
            break;
        case "mvfile":
            tData = `?old=${tData}&new=${tData2}`;
            break;
        case "uploadlink":
            pType = "application/x-www-form-urlencoded"
            pData = `link=${tData}`
            break;
        case "saveclip":
            pType = "application/x-www-form-urlencoded"
            pData = `data=${tData}`
            break;
        case "consolepost":
            pType = "application/x-www-form-urlencoded"
            pData = `text=${tData}`
            break;
        case "sendfile":
            tData = `?target=${tData}&path=${tData2}`;
            break;
        default:
            break;
    }
    fetch('/api/task/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `name=${encodeURIComponent(tName)}&type=${encodeURIComponent(tType)}&data=${encodeURIComponent(tData)}&pType=${encodeURIComponent(pType)}&pData=${encodeURIComponent(pData)}`
    }).then(response => response.text())
    .then(result => {
        document.location.reload(true);
    }).catch(error => {
        alert(error);
    });
}

function startTask(){
    const tName = document.getElementById('stName').value;
    fetch('/api/task/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `name=${encodeURIComponent(tName)}`
    }).then(response => response.text())
    .then(result => {
        document.location.reload(true);
        console.log(result);
    }).catch(error => {
        alert(error);
    });
}

function startRoutine(){
    const tName = document.getElementById('intName').value;
    const tTime = parseInt(document.getElementById('intTime').value, 10);
    const tMins = tTime * 60000;
    fetch('/api/task/interval/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `name=${encodeURIComponent(tName)}&time=${encodeURIComponent(tMins)}&`
    }).then(response => response.text())
    .then(result => {
        document.location.reload(true);
        console.log(result);
    }).catch(error => {
        alert(error);
    });
}

function addToClipboard(){
    const inpc = document.getElementById('addToClip').value;
    fetch('/api/clip/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(inpc)}`
    }).then(response => response.text())
    .then(result => {
        document.location.reload(true);
        console.log(result);
    }).catch(error => {
        alert(error);
    });
}

function addNote(){
    const nName = document.getElementById('nName').value;
    const nText = document.getElementById('nText').value;
    const nDate = document.getElementById('nDate').value;
    fetch('/api/notes/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `name=${encodeURIComponent(nName)}&text=${encodeURIComponent(nText)}&date=${encodeURIComponent(nDate)}`
    }).then(response => response.text())
    .then(result => {
        document.location.reload(true);
        console.log(result);
    }).catch(error => {
        alert(error);
    });
}

function getRemove(linkC){
    fetch(linkC, {
        method: 'GET',
    }).then(response => response.text())
    .then(result => {
        document.location.reload(true);
        console.log(result);
    }).catch(error => {
        alert(error);
    });
}

function manyParsers(str){
    return str.split(" ").map(elem => "&parse="+elem).join("");
}