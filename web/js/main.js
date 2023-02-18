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