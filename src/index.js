module.exports = class TaskBus {
	constructor(tasks, limit, maxRetryCount) {
		this.limit = limit;
		this.maxRetryCount = maxRetryCount;

		this.running = 0;
		this.completed = 0;
		this.done = false;
		this.tasks = [];

		tasks.forEach(task => this.add(task))
	}

	count() {
		return this.tasks.length;
	}

	isDone() {
		return this.count() === 0 && this.running === 0;
	}

	add(task, retryCount = 0) {
		this.tasks.push({ task, retryCount});
	}

	addToStart(task, retryCount = 0) {
		this.tasks.unshift({ task, retryCount} );
	}

	run() {
		if (this.count() === 0) {
      return Promise.resolve();
    }

		return new Promise((resolve, reject) => {
			while(checkRunning.call(this)) {
				this.runHandler(successHandler.bind(this), errorHandler.bind(this));
			}

			function successHandler() {
				if (this.isDone()) {
					resolve()
				} else {
					this.runHandler(successHandler.bind(this), errorHandler.bind(this));
				}
			}

			function errorHandler(error) {
				this.tasks = [];
				this.done = true;

				reject(error);
			}

			function checkRunning() {
				if (this.count() === 0) return false;
				if (!this.limit) return true;

				return this.running < this.limit;
			}
		});
	}

	runHandler(success, error) {
		if (this.count() === 0) {
			return;
		}

		const { task, retryCount } = this.tasks.shift();

		task().then(() => {
			--this.running;

			success()
		}, () => {
			if (retryCount < this.maxRetryCount) {
				this.addToStart(task, retryCount + 1);
				--this.running;

				return success();
			}

			error()
		});

		++this.running
	}
};
