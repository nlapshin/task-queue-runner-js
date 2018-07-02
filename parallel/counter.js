module.exports = class TaskCounter {
	constructor(tasks = [], maxCount = 0) {
		this.maxCount = maxCount;
		this.counter = {};
	}

	inc(index) {
		this.counter[index] = this.counter[index] ? this.counter[index] + 1 : 1;
	}

	check(index) {
		return this.counter[index] == this.maxCount;
	}
};
