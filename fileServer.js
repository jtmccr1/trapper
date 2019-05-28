const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(function(req, res, next) {
	console.log(`${req.method} request for '${req.url}'`);
	next();
});

app.use(express.static('./src/'));

app.set('port', process.env.PORT || 4001);
app.listen(app.get('port'), () => console.log('Data available for visualization.'));

module.exports = app;
