import sys
# pip install -r requirements.txt
import requests
import pyperclip

hmmAddr = ''

def tasks(i):
    if len(i) <= 1:
        print (requests.get(hmmAddr+"/api/task").text)
    elif i[1] == "add":
        print (requests.post(hmmAddr+"/api/task/add", data={"name": i[2], "type": i[3], "data": i[4]}).text)
    elif i[1] == "run":
        print (requests.post(hmmAddr+"/api/task/run", data={"name": i[2]}).text)
    elif i[1] == "del":
        print (requests.get(hmmAddr+"/api/task/del/"+i[2]).text)

def routine(i):
    if len(i) <= 1:
        print (requests.get(hmmAddr+"/api/task/interval").text)
    elif i[1] == "add":
        print (requests.post(hmmAddr+"/api/task/interval/add", data={"name": i[2], "time": i[3]}).text)
    elif i[1] == "kill":
        print (requests.get(hmmAddr+"/api/task/interval/kill/"+i[2]).text)

def clip(i):
    if len(i) <= 1:
         pyperclip.copy((requests.get(hmmAddr+"/api/clip").text))
    elif i[1] == "history":
        print (requests.get(hmmAddr+"/api/clip/history").text)
    elif i[1] == "erase":
        print (requests.get(hmmAddr+"/api/clip/erase").text)
    elif len(i) > 1:
        print (requests.post(hmmAddr+"/api/clip/save", data={"data": i[1]}).text)

def notes(i):
    if len(i) <= 1:
        print (requests.get(hmmAddr+"/api/notes").text)
    elif i[1] == "add":
        print (requests.post(hmmAddr+"/api/notes/add", data={"name": i[2], "text": i[3], "date": i[4]}).text)
    elif i[1] == "del":
        print (requests.get(hmmAddr+"/api/notes/del/"+i[2]).text)

def upload(i):
    if i[1] == "link":
        print (requests.post(hmmAddr+"/api/uploadLink", data={"link": i[2]}).text)
    elif len(i)>1:
        with open(i[1], 'rb') as file:
            response = requests.post(hmmAddr+"/api/upload", files={'file': file})

def download(i):
    if len(i)>1:
            with open(i[1], 'wb') as file:
                file.write(requests.get(hmmAddr+"/api/download/"+i[1]).content)

def scrapper(i):
    if i[1] == "links":
        print (requests.get(hmmAddr+"/api/scraper/links?link="+i[2]).text)
    elif i[1] == "imgs":
        print (requests.get(hmmAddr+"/api/scraper/imgs?link="+i[2]).text)
    elif i[1] == "cheerio":
        print (requests.get(hmmAddr+"/api/scraper/cheeriohtml?link="+i[2]+"&parse="+i[3]).text)

def files(i):
    print (requests.get(hmmAddr+"/api/files/list").text)

def ex(i):
    quit()

def httpp():
    return "/api/httpp/"

def httpps():
    return "/api/httpps/"

def txthttpp():
    return "/api/txt/httpp/"

def txthttpps():
    return "/api/txt/httpps/"

proxies = {
    "http": httpp,
    "https": httpps,
    "httptxt": txthttpp,
    "httpstxt": txthttpps
}

def proxy(i):
    print (requests.get(hmmAddr+proxies[i[1]]()+i[2]).text)

apis = {
    "tasks": tasks,
    "routine": routine,
    "clip": clip,
    "notes": notes,
    "upload": upload,
    "download": download,
    "scrapper": scrapper,
    "proxy": proxy,
    "files": files,
    "exit": ex
}

def splitWithoutQuo(txt, delimiter=' '):
    result = []
    inside_quotes = False
    current_word = ''
    for char in txt:
        if char == delimiter and not inside_quotes:
            result.append(current_word.strip('"'))
            current_word = ''
        else:
            current_word += char
            if char == '"':
                inside_quotes = not inside_quotes
    result.append(current_word.strip('"'))
    return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print ("[i] Usage: python3 hmmClient.py http://<host>:<port>")
    else:
        while True:
            i = splitWithoutQuo(input("hmmC*> "))
            if len(i) < 1:
                continue
            else:
                hmmAddr = sys.argv[len(sys.argv)-1]
                apis[i[0]](i)
