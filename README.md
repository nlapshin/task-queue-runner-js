# task-queue

This module allows you to run the queue of the asynchronous tasks in the form of a queue (so far parallel).

# Install

```sh
npm i async-task-queue-runner
```

# Usage

## Queue constructor

```js

function runTasks() {
	return new Promise((resolve, reject) => {
		let queue = new TaskQueue();
		let tasks = [ taskFactory(500), taskFactory(300), taskFactory(100) ];

		let completeTask = 0;

		tasks.forEach((task, index) => {
			let runTask = () => {
				return task.then(result => {
					console.log("task result", result);

					++completeTask;

					if (completeTask == tasks.length) {
						console.log("all tasks complete");

						resolve();
					};
				}).catch(err => {
					console.log("task end with error");

					reject(err);
				})
			};

			queue.addTask(runTask);
		});
	};
};

function taskFactory(duration=1000, isSuccess=true) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			if (isSuccess) resolve("success");
			else reject("error");
		}, duration);
	});
};
```

## Task runner

```js

function runTasks() {
	let tasks = [ taskFactory.bind(null, 500), taskFactory.bind(null, 300), taskFactory.bind(null, 100) ];

	let success = (result, inx) => {
		console.log("task index - ", inx, ".Task result - ", result);
	};

	return runner(tasks)(success);
};

function taskFactory(duration=1000, isSuccess=true) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			if (isSuccess) resolve("success");
			else reject("error");
		}, duration);
	});
};

```

# API

## parallel

The module allows you to run asynchronous tasks in parallel

### parallel.Queue(limit)

it's a task queue class.

**limit** - number of tasks that run simultaneously in parallel. Default 0 (running all tasks in parallel).

#### Instance methods

#### queue.addTask(task)

It's method push task into queue.

#### queue.next()

Call the next task. In the existing queue, it is called automatically.

### parallel.runner(tasks, limit)(success, error, context)

The function that creates the queue and allows you to add the necessary handlers to each task in a given context.

**tasks** - array of asynchronous tasks.

**limit** - number of tasks that run simultaneously in parallel. Default 0 (running all tasks in parallel). Optional.

**success** - success function like a promise success function. Optional.

**error** - error function like a promise success function. Optional.

**context** - context for success and error function. Optional.

# License

MIT © nlapshin
