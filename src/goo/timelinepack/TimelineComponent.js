define([
	'goo/entities/components/Component'
], function (
	Component
	) {
	'use strict';

	/**
	 * Timeline component
	 * @example <caption>{@linkplain http://code.gooengine.com/latest/visual-test/goo/timelinepack/TimelineComponent/TimelineComponent-vtest.html Working example}</caption>
	 * @constructor
	 */
	function TimelineComponent() {
		this.type = 'TimelineComponent';

		this.channels = [];

		this.time = 0;
		this.duration = 0;
		this.loop = false;
	}

	TimelineComponent.prototype = Object.create(Component.prototype);
	TimelineComponent.prototype.constructor = TimelineComponent;

	/**
	 * Adds a channel
	 * @param {Channel} channel
	 */
	TimelineComponent.prototype.addChannel = function (channel) {
		this.channels.push(channel);
	};

	/**
	 * Updates all channels with the time per last frame
	 * @param {number} tpf
	 */
	TimelineComponent.prototype.update = function (tpf) {
		var time = this.time + tpf;
		if (time > this.duration) {
			if (this.loop) {
				time = time % this.duration;
			} else {
				time = this.duration;
			}
		} else if (time < 0) {
			this.time = 0;
		}
		if (time === this.time) { return; }
		this.time = time;

		for (var i = 0; i < this.channels.length; i++) {
			var channel = this.channels[i];

			channel.update(this.time);
		}
	};

	/**
	 * Sets the time on all channels
	 * @param {number} time
	 */
	TimelineComponent.prototype.setTime = function (time) {
		this.time = time;

		for (var i = 0; i < this.channels.length; i++) {
			var channel = this.channels[i];

			channel.setTime(this.time);
		}
	};

	/**
	 * Retrives the values of all channels
	 * @private
	 * @returns {object}
	 */
	TimelineComponent.prototype.getValues = function () {
		var retVal = {};

		for (var i = 0; i < this.channels.length; i++) {
			var channel = this.channels[i];
			retVal[channel.id] = channel.value;
		}

		return retVal;
	};

	return TimelineComponent;
});