const Queue = require("./queue");

module.exports = (tasks, limit=0) => {
	let queue = new Queue(limit);

	return (iteratorSuccess, iteratorError, context=this) => {
		return new Promise((resolve, reject) => {
			let complete = 0;

			tasks.forEach((task, index) => {
				let runTask = () => {
					return task().then(result => {
						var promise = iteratorSuccess.call(context, result, index, tasks);

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
