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