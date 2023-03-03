# Home Middleman
Home Middleman is a home server written in Node.js that combines multiple essential features in a single package. Whether you want to browse the web securely, scrape data from websites, manage files from multiple devices, take notes and access them from multiple devices, or automate your routine tasks, Home Middleman can help you with that.
## Features
- HTTP/HTTPS proxy: Keep your online activities private.
- HTTP/HTTPS TXT proxy: browse websites in text version (useful when you want to browse the internet with curl tool)
- Web scraper: Easily extract data from websites.
- Cloud storage: Store your files and documents in the cloud and access them from anywhere, anytime.
- Notes: Take notes and access them from multiple devices.
- Clipboard: Save snippets of text or code across multiple devices for quick access and reuse.
- Tasks: Save activity settings (such as scraper settings) and execute them with ease by passing a task name to the server.
- Routine: Automate your routine tasks by scheduling the execution of tasks at specified intervals (for example, execute HTTP proxy to website "example.com" every 15 minutes).
## Usage
- download project repository
- install required Node.js libraries
```
npm install express
npm install --save multer
npm install cheerio
```
- start the server with
```
node index.js
```
- access the web application via a web browser (default: http://localhost:1337), or via a python script located in the 'client/' folder
- ps: if you want to access the web application from any device in the network, change the 'index.js' file code from:
```
const host = 'localhost';
```
to:
```
const host = '0.0.0.0';
```
## License
Home Middleman is open-source software licensed under the MIT License. Feel free to use it, modify it, and share it with others.
