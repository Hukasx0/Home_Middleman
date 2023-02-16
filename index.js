const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();

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
    res.send("Hello world!");
});

app.post('/upload', upload.single('file'), (req, res) => {
    // curl -X POST -F "file=@example.txt" http://localhost:1337/upload
    if(!req.file){
        res.status(400).send("No file specified");
    }
    else{
        res.status(200).send("File uploaded successfully");
    }
});

app.get('/download/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    res.sendFile(path.join(__dirname, 'upload/'+fileName));
});

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
});