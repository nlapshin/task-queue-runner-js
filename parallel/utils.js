const QueueBus = require("./queueBus");

function forEachParallel(array, handler, limit = 0, thisArg) {
  const queueArray = array.map((val, index) => handler.bind(thisArg || this, val, index, array));
  const queue = new QueueBus(limit, queueArray);

  return queue.run();
}

module.exports = {
  forEachParallel
}
