const debug = require('debug')('c9:app');
const app = require('../app');

app.set('port', process.env.PORT || 3000);
app.set('env', process.env.NODE_ENV || 'production');

server = app.listen(app.get('port'), "0.0.0.0", () => {
    debug('Express server listening on port %d', server.address().port);
});