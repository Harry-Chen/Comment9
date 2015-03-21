module.exports = WTF = ()->
  if not this instanceof WTF
      return new WTF()
  @queue = []
  this
  
WTF::insert = (key, value)->
  @queue.push {key: key, value: value}

WTF::findAndRemove = (key)->
  for i in [0..@queue.length]
    if @queue[i].key is key
      v = @queue[i].value
      @queue.splice(i, 1)
      return v
  return undefined
