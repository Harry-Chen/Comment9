#!/bin/sh
###
NODE_ENV=production exec continuation $0 -e -c
###
"use continuation"

debug = require('debug')('Comment9')
app = require '../app'

app.set 'port', process.env.PORT || 3000
app.set 'env', 'production'

server = app.listen app.get('port'), "127.0.0.1", cont()
debug 'Express server listening on port ' + server.address().port

