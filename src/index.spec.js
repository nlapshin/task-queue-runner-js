const { assert, use } = require("chai");
const chaiAsPromised = require("chai-as-promised");

use(chaiAsPromised);

const TaskBus = require("./");

class TaskGenerator {
  constructor() {
    this.resolveList = [];
    this.rejectOnce = {};
  }

  timer(duration=1000, isSuccess=true) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.resolveList.push(duration);

        if (isSuccess) resolve("success");
        else reject("error");
      }, duration);
    });
  }

  timerRejectOnce(duration=1000) {
    this.rejectOnce[duration] = false;

    return () => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          this.resolveList.push(duration);

          if (this.rejectOnce[duration] === true) {
            resolve("success");
          } else {
            this.rejectOnce[duration] = true;

            reject("error");
          }
        }, duration);
      });
    }
  }
}

describe("TaskBus", function() {
  it('full parallel', async() => {
    const taskGenerator = new TaskGenerator();
    let tasks = [ taskGenerator.timer.bind(taskGenerator, 500), taskGenerator.timer.bind(taskGenerator, 300), taskGenerator.timer.bind(taskGenerator, 100) ];

    const bus = new TaskBus(tasks);

    await bus.run();

    assert.deepEqual(taskGenerator.resolveList, [ 100, 300, 500 ]);
  });

  it('with limit', async() => {
    const taskGenerator = new TaskGenerator();
    let tasks = [ taskGenerator.timer.bind(taskGenerator, 500), taskGenerator.timer.bind(taskGenerator, 300), taskGenerator.timer.bind(taskGenerator, 100) ];

    const bus = new TaskBus(tasks, 1);

    await bus.run();

    assert.deepEqual(taskGenerator.resolveList, [ 500, 300, 100 ]);
  });


  it('with concurrency', async() => {
    const taskGenerator = new TaskGenerator();
    let tasks = [ taskGenerator.timer.bind(taskGenerator, 500), taskGenerator.timer.bind(taskGenerator, 300), taskGenerator.timer.bind(taskGenerator, 100) ];

    const bus = new TaskBus(tasks, 2);

    await bus.run();

    assert.deepEqual(taskGenerator.resolveList, [ 300, 100, 500 ]);
  });

  it('with error', async() => {
    const taskGenerator = new TaskGenerator();
    let tasks = [ taskGenerator.timer.bind(taskGenerator, 500), taskGenerator.timer.bind(taskGenerator, 300, false), taskGenerator.timer.bind(taskGenerator, 100) ];

    const bus = new TaskBus(tasks);

    await assert.isRejected(bus.run());

    assert.deepEqual(taskGenerator.resolveList, [ 100, 300 ]);
  });

  it('with retry and error', async() => {
    const taskGenerator = new TaskGenerator();
    let tasks = [ taskGenerator.timer.bind(taskGenerator, 500), taskGenerator.timer.bind(taskGenerator, 300, false), taskGenerator.timer.bind(taskGenerator, 100) ];

    const bus = new TaskBus(tasks, 0, 1);

    await assert.isRejected(bus.run());

    assert.deepEqual(taskGenerator.resolveList, [ 100, 300, 500, 300 ]);
  });

  it('with retry and retry funcs after once call', async() => {
    const taskGenerator = new TaskGenerator();
    let tasks = [ taskGenerator.timer.bind(taskGenerator, 500), taskGenerator.timerRejectOnce(300), taskGenerator.timer.bind(taskGenerator, 100) ];

    const bus = new TaskBus(tasks, 0, 1);

    await bus.run();

    assert.deepEqual(taskGenerator.resolveList, [ 100, 300, 500, 300 ]);
  });

  it('should collect new tasks after start', async() => {
    const taskGenerator = new TaskGenerator();
    let tasks = [ taskGenerator.timer.bind(taskGenerator, 500), taskGenerator.timer.bind(taskGenerator, 300), taskGenerator.timer.bind(taskGenerator, 100) ];

    const bus = new TaskBus(tasks);

    setTimeout(() => {
      bus.add(taskGenerator.timer.bind(taskGenerator, 150))
      bus.add(taskGenerator.timer.bind(taskGenerator, 700))
    }, 100)

    await bus.run();

    assert.deepEqual(taskGenerator.resolveList, [ 100, 150, 300, 500, 700 ]);
  });

  it('should collect new tasks after start with limit', async() => {
    const taskGenerator = new TaskGenerator();
    let tasks = [ taskGenerator.timer.bind(taskGenerator, 500), taskGenerator.timer.bind(taskGenerator, 300), taskGenerator.timer.bind(taskGenerator, 100) ];

    const bus = new TaskBus(tasks, 2);

    setTimeout(() => {
      bus.add(taskGenerator.timer.bind(taskGenerator, 150))
      bus.add(taskGenerator.timer.bind(taskGenerator, 700))
    }, 100)

    await bus.run();

    assert.deepEqual(taskGenerator.resolveList, [ 300, 100, 500, 150, 700 ]);
  });
})
