module.exports = class TaskQueue {
	constructor(limit) {
		this.limit = limit;
		this.running = 0;

		this.queue = [];
	}

	addTask(task) {
		this.queue.push(task);
		this.next();
	}

	next() {
		while(checkRunning.call(this)) {
			const task = this.queue.shift();

			task().then(() => {
				--this.running;
				this.next();
			});

			++this.running;
		}

		function checkRunning() {
			if (!this.queue.length) return false;
			if (!this.limit) return true;

			return this.running < this.limit;
		};
	}
};
