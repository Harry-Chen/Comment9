WTF = require './WTFTree'
module.exports = (timeout)->
  queue = new WTF();
  return {
    enQueue: (aid, client)->
      queue.insert(aid, 
        res: client,
        aid: aid,
        timer: setTimeout ()->
          client.json({})
          client.end()
          queue.findAndRemove aid
        , timeout
      )
    getOne: (aid)->
      value = queue.findAndRemove aid
      if value?
        clearTimeout value.timer
        return value.res
      else
        return undefined
  }
