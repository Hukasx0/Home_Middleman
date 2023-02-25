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
    const tName = document.getElementById('tName').value;
    const tType = document.getElementById('tType').value;
    const tData = document.getElementById('tData').value;
    fetch('/api/task/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `name=${encodeURIComponent(tName)}&type=${encodeURIComponent(tType)}&data=${encodeURIComponent(tData)}`
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