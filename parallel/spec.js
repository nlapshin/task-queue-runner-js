const { assert } = require("chai");
const delay = require('delay');

const runner = require("./runner");
const TaskQueue = require("./queue");
const utils = require('./utils');

describe("parallel", function() {
	describe("runner", function() {
		it("parallel", function() {
			let tasks = [ taskFactory.bind(null, 500), taskFactory.bind(null, 300), taskFactory.bind(null, 100) ];
			let completeStep = [ 2, 1, 0 ];

			let success = (result, inx) => {
				var curStep = completeStep.shift();
				assert.equal(curStep, inx);

				console.log("complete func ", inx + 1);
			};

			var runFn = runner(tasks);

			return runFn(success);
		});

		it("parallel with limit", function() {
			let tasks = [ taskFactory.bind(null, 500), taskFactory.bind(null, 300), taskFactory.bind(null, 100) ];
			let completeStep = [ 0, 1, 2 ];

			let success = (result, inx) => {
				var curStep = completeStep.shift();
				assert.equal(curStep, inx);

				console.log("complete func ", inx + 1);
			};

			return runner(tasks, 1)(success);
		});

		it("parallel with error", function() {
			let tasks = [ taskFactory.bind(null, 500), taskFactory.bind(null, 300, false), taskFactory.bind(null, 100) ];
			let completeStep = [ 2, 0 ];

			let success = (result, inx) => {
				var curStep = completeStep.shift();
				assert.equal(curStep, inx);

				console.log("complete func ", inx + 1);
			};

			let error = (err) => {
				assert.equal(err, "error");

				return Promise.resolve();
			};

			var runFn = runner(tasks);

			return runFn(success, error);
		});

		it("parallel without tasks", function() {
			let tasks = [ ];
			let completeStep = [ ];

			let success = (result, inx) => {};

			var runFn = runner(tasks);

			return runFn(success);
		});

		it("parallel with retry count", function() {
			let tasks = [
				taskFactoryRetry().bind(null, 10, 0),
				taskFactoryRetry().bind(null, 10, 1),
				taskFactoryRetry().bind(null, 10, 2),
				taskFactoryRetry().bind(null, 10, 3),
				taskFactoryRetry().bind(null, 10, 4),
				taskFactoryRetry().bind(null, 10, 5)
			];

			let success = (result, inx) => {
				assert.include([0, 1, 2, 3], inx);
			};

			let error = (result, inx) => {
				assert.include([4, 5], inx);

				return Promise.resolve();
			};

			return runner(tasks, 0, 3)(success, error);
		});

		function taskFactory(duration=1000, isSuccess=true) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					if (isSuccess) resolve("success");
					else reject("error");
				}, duration);
			});
		};

		function taskFactoryRetry() {
			let callRetry = null;

			return function (duration=1000, retryCount=2) {
				if (callRetry === null) {
					callRetry = 0;
				} else {
					callRetry += 1;
				};

				return new Promise((resolve, reject) => {
					setTimeout(() => {
						if (callRetry >= retryCount) resolve("success");
						else reject("error");
					}, duration);
				});
			};
		};
	})

	describe("queue", function() {
		it("parallel", function() {
			return new Promise((resolve, reject) => {
				let tasks = [ taskFactory(500), taskFactory(300), taskFactory(100) ];
				let queue = new TaskQueue();

				let complete = 0;

				let runStep = [ 1, 2, 3 ];
				let completeStep = [ 3, 2, 1 ];

				tasks.forEach((task, index) => {
					let runTask = () => {
						let taskCount = index + 1;
						let curStep =  runStep.shift();
						assert.equal(curStep, taskCount);

						console.log("task", taskCount, "run");

						return task.then((result) => {
							let curStep = completeStep.shift();

							assert.equal(curStep, taskCount);

							complete++;
							console.log("task", index + 1, "complete");

							if (complete == tasks.length) {
								console.log("all tasks complete");

								resolve();
							};
						}).catch(err => {
							console.log("task end with error");

							reject(err);
						});
					};

					queue.addTask(runTask);
				});
			});
		});

		it("parallel with limit", function() {
			return new Promise((resolve, reject) => {
				let tasks = [ taskFactory(500), taskFactory(300), taskFactory(100) ];
				let queue = new TaskQueue(1);

				let complete = 0;

				let runStep = [ 1, 2, 3 ];
				let completeStep = [ 1, 2, 3 ];

				tasks.forEach((task, index) => {
					let runTask = () => {
						let taskCount = index + 1;
						let curStep =  runStep.shift();
						assert.equal(curStep, taskCount);

						console.log("task", taskCount, "run");

						return task.then(() => {
							let curStep = completeStep.shift();
							assert.equal(curStep, taskCount);

							complete++;
							console.log("task", taskCount, "complete");

							if (complete == tasks.length) {
								console.log("all tasks complete");

								resolve();
							};
						}, (err) => {
							console.log("task end with error");

							reject(err);
						});
					};

					queue.addTask(runTask);
				})
			});
		});

		it("parallel with error", function() {
			let errMsg = "reject step 2";
			let tasks = [ taskFactory(500), taskFactory(300), taskFactory(100) ];

			return new Promise((resolve, reject) => {
				let queue = new TaskQueue();

				let complete = 0;

				let runStep = [ 1, 2, 3 ];
				let completeStep = [ 3, 2, 1 ];

				tasks.forEach((task, index) => {
					let runTask = () => {
						let taskCount = index + 1;
						let curStep =  runStep.shift();
						assert.equal(curStep, taskCount);

						console.log("task", taskCount, "run");

						return task.then(() => {
							let curStep = completeStep.shift();

							assert.equal(curStep, taskCount);

							complete++;
							console.log("task", index + 1, "complete");

							if (curStep == 2) {
								reject(errMsg);
							};

							if (complete == tasks.length) {
								console.log("all tasks complete");

								resolve();
							};
						}).catch(err => {
							console.log("task end with error");

							reject(err);
						});
					};

					queue.addTask(runTask);
				})
			}).then(() => {
				throw "test should not success";
			}, (err) => {
				assert.equal(err, errMsg);

				return Promise.resolve();
			});
		});

		function taskFactory(duration=1000, isSuccess=true) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					if (isSuccess) resolve("success");
					else reject("error");
				}, duration);
			});
		};
	});

	describe('utils', () => {
		describe('forEachParallel', async() => {
			it('full parallel', async() => {
				let output = [];

				await utils.forEachParallel([1, 2, 3, 4, 5], async(num, index) => {
					await delay(100);

					output.push(num + 1)
				});

				assert.deepEqual(output, [2,3,4,5,6])
			});

			it('parallel with limit', async() => {
				let output = [];

				await utils.forEachParallel([1, 2, 3, 4, 5], async(num, index) => {
					await delay(100);

					output.push(num + 1)
				}, 2);

				assert.deepEqual(output, [2,3,4,5,6])
			});

			it('parallel with error', async() => {
				let output = [];

				try {
					await utils.forEachParallel([1, 2, 3, 4, 5], async(num, index) => {
						await delay(100);

						if (num === 3) {
							throw 'error';
						}

						output.push(num + 1)
					}, 2);

					throw "test should not success";
				} catch(error) {
					assert.equal(error, 'error');

					assert.deepEqual(output, [2,3,5])

					return Promise.resolve();
				}
			});
		});
	});
})
