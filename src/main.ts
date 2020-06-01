import { createServer, IncomingMessage, ServerResponse } from "http";
import axios, { Method } from "axios";
import dayjs from "dayjs";

function getSourceUrl(url: string): string {
    if (url.startsWith("/sta"))
        return "https://sta.codeforces.com" + url.slice(4);
    if (url.startsWith("/assets"))
        return "https://assets.codeforces.com" + url.slice(7);
    return "https://codeforces.com" + url;
}
function getHost(url: string): string {
    if (url.startsWith("/sta"))
        return "sta.codeforces.com";
    if (url.startsWith("/assets"))
        return "assets.codeforces.com";
    return "codeforces.com";
}
async function handleRequest(req: IncomingMessage, req_body: any, res: ServerResponse) {
    try {
        console.log(`${dayjs().format()} : ${req.url}`);
        let actualHost = getHost(req.url);
        if (req.headers.referer)
            req.headers.referer = req.headers.referer.replace(req.headers.host, actualHost);
        if (req.headers.origin)
            req.headers.origin = (req.headers.origin as string).replace(req.headers.host, actualHost);
        req.headers.host = actualHost;
        let ret = await axios({
            url: getSourceUrl(req.url),
            method: req.method as Method,
            responseType: "arraybuffer",
            validateStatus: sta => true,
            headers: req.headers,
            data: req_body,
        });
        res.writeHead(ret.status, ret.headers);
        let data: Buffer = ret.data;
        if ((ret.headers['content-type'] as string).includes("image")) {
            res.write(data);
        } else {
            let content = data.toString()
                .replace(/fonts.googleapis.com/g, "fonts.loli.net")
                .replace(/(https:|http:|)\/\/odeforces.com/g, "/")
                .replace(/(https:|http:|)\/\/sta.codeforces.com/g, "/sta")
                .replace(/(https:|http:|)\/\/assets.codeforces.com/g, "/assets");
            res.write(content);
        }
        res.end();
    } catch (error) {
        console.log(error);
    }
}
createServer(async (req, res) => {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
        });
        req.on('end', () => {
            handleRequest(req, body, res);
        });
    } else
        handleRequest(req, null, res);
}).listen(8082);
