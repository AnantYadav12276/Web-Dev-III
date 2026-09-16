const http = require("http");

const PORT = 3000;

const server = http.createServer((req, res) => {

    console.log("Request received:", req.url);

    res.setHeader("Content-Type", "text/plain");

    if (req.url === "/") {
        res.statusCode = 200;
        res.end("Welcome to Node Server");
    }

    else if (req.url === "/about") {
        res.statusCode = 200;
        res.end("About Page");
    }

    else if (req.url === "/contact") {
        res.statusCode = 200;
        res.end("Contact Page");
    }

    else {
        res.statusCode = 404;
        res.end("404 - Page Not Found");
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});