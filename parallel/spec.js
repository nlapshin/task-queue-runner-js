var assert = require("chai").assert;

var runner = require("./runner");
var TaskQueue = require("./queue");

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

		function taskFactory(duration=1000, isSuccess=true) {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					if (isSuccess) resolve("success");
					else reject("error");
				}, duration);
			});
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
})
