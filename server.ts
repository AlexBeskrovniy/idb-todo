import express from 'express';

const server = express();

const PORT = process.env.PORT || 4003;

server.use(express.static('static'));

server.get('/', (_, res) => {
    res.send('index.html');
});

server.listen(PORT, () => {
    console.log(`Server started on \x1b[34mhttp://localhost:${PORT}`);
});