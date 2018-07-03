module.exports = class TaskCounter {
	constructor(tasks = [], maxCount = 0) {
		this.maxCount = maxCount;
		this.counter = {};
	}

	inc(index) {
		this.counter[index] = this.counter[index] ? this.counter[index] + 1 : 1;
	}

	check(index) {
		let curCount = this.counter[index] || 0;

		return curCount == this.maxCount;
	}
};
