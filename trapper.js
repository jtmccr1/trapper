const express = require('express');
const cors = require('cors');
const app = express();

const dataDirectory = process.argv[2];
app.use(cors());
app.use(function(req, res, next) {
	console.log(`${req.method} request for '${req.url}'`);
	next();
});

app.use(express.static(dataDirectory));

app.set('port', process.env.PORT || 4001);
app.listen(app.get('port'), () => console.log(`Data from ${dataDirectory} available for visualization.`));

module.exports = app;
