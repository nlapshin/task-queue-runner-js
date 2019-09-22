module.exports = class TaskQueueBus {
	constructor(limit, queue) {
		this.limit = limit;
		this.running = 0;
		this.completed = 0;
		this.done = false;

		this.queue = queue;
		this.count = queue.length;
	}

	run() {
		return new Promise((resolve, reject) => {
			while(checkRunning.call(this)) {
				this.runHandler(successHandler.bind(this), errorHandler.bind(this));
			};

			function successHandler() {
				++this.completed;

				console.log(this.count, this.completed);

				if (this.count === this.completed) {
					resolve()
				} else {
					this.runHandler(successHandler.bind(this), errorHandler.bind(this));
				}
			}

			function errorHandler(error) {
				this.queue = [];
				this.done = true;

				reject(error);
			}

			function checkRunning() {
				if (!this.queue.length) return false;
				if (!this.limit) return true;

				return this.running < this.limit;
			};
		});
	}

	runHandler(success, error) {
		if (this.queue.length === 0) {
			return;
		};

		const task = this.queue.shift();

		task().then(() => {
			--this.running;

			success()
		}, error);

		++this.running
	}

		// while(checkRunning.call(this)) {
		// 	const task = this.queue.shift();

		// 	task().then(() => {
		// 		--this.running;
		// 		this.run();
		// 	});

		// 	++this.running;
    // }

    // if (this.queue.length === 0) {
    //   done()
    // }

		// function checkRunning() {
		// 	if (!this.queue.length) return false;
		// 	if (!this.limit) return true;

		// 	return this.running < this.limit;
		// };


  // runHandler() {
  //   const task = this.queue.shift();

  //   task().then(() => {
  //     --this.running;
  //     this.run();
  //   });

  //   ++this.running;
  // }
};
