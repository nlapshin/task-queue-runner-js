const Queue = require("./queue");
const Counter = require("./counter");

module.exports = (tasks=[], limit=0, retryCount=0) => {
	let queue = new Queue(limit);
	let counter = new Counter(tasks, retryCount)

	return (iteratorSuccess, iteratorError, context=this) => {
		return new Promise((resolve, reject) => {
			let complete = 0;

			if (tasks.length == 0) {
				resolve();
			};

			tasks.forEach((task, index) => {
				let runTask = () => {
					return task().then(result => {
						let promise;

						if (iteratorSuccess) {
							promise = iteratorSuccess.call(context, result, index, tasks);
						} else {
							promise = Promise.resolve();
						};

						complete++;

						if (complete == tasks.length) {
							resolve();
						};

						return promise;
					}, err => {
						if (iteratorError) {
							return iteratorError.call(context, err, index).then(() => {
								complete++;
							});
						};

						return Promise.reject(err);
					}).catch(err => {
						reject(err);
					});
				};

				queue.addTask(runTask);
			});
		});
	};
};
