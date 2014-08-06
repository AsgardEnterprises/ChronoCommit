(function() {

	'use strict';

	/* Services */
	angular.module('chronoCommit.services', [])
		.service('timeDataService', ['$http', '$q', 'colorService',
			function($http, $q, colorService) {
				this.day = 2;
				this.hour = 17;

				this.sliderScaleMax = 168;

				this.data = null;

				this.updateDayAndHour = function(sliderValue) {

					// length of the scale we are mapping from
					var scaleLength = this.sliderScaleMax;

					// length of each day
					var dayLength = scaleLength / 7;

					// length of each hour
					var hourLength = dayLength / 24;

					// first calculate the day
					this.day = Math.floor(sliderValue / dayLength);

					// now calculate the hour
					var dayReminder = sliderValue % dayLength;
					this.hour = Math.floor(dayReminder / hourLength);
				};

				this.getTimeDescription = function() {
					var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
					var display_hour = this.hour < 10 ? "0" + this.hour : this.hour;
					return days[this.day] + ", " + display_hour + ":00 (CST)";
				};

				// Returns a promise that fetches the commit data
				// if it hasn't already been collected.
				this.mapDataPromise = function() {
					var that = this;

					var defer = $q.defer();
					if (this.data !== null) {
						defer.resolve(this.data);
					} else {
						$http.get('assets/hourly_commits.json').error(function(data, status) {
							var message = status + ': ' + data;
							console.log(message);
							defer.reject(message);
						}).success(function(data) {
							that.data = data;
							defer.resolve(data);
						});
					}

					return defer.promise;
				};

				this.getMapData = function() {
					var that = this;

					return this.mapDataPromise()
						.then(function(data) {
							colorService.setMaxValue(data);
							return data;
						})
						.then(function(data) {
							return data.filter(function(datum) {
								return datum.day == that.day && datum.hour == that.hour;
							});
						}).then(function(data) {
							return data.reduce(function(memo, item) {
								memo[item.country] = {
									'fillKey': colorService.colorIndex(item.country, item.commits),
									'numberOfThings': item.commits
								};
								return memo;
							}, {});
						});
				};

				// Returns all the data for a particular country.
				// Data will not be ordered!
				// A promise is returned. Use promise.then(function(data) { ... }) to get the data.
				this.getCountryData = function(country_code) {
					return this.mapDataPromise()
						.then(function(data) {
							return data.filter(function(datum) {
								return datum.country == country_code;
							});
						});
				};
			}
		])
		.service('colorService', function() {
			this.maxValue = 0;
			this.hue = 128;

			this.setMaxValue = function(data) {
				this.maxValue = data.reduce(function(memo, item) {
					if (memo[item.country] === undefined || memo[item.country] < item.commits) {
						memo[item.country] = item.commits;
					}

					return memo;
				}, {});
			};

			this.getColorPalette = function(hue) {
				var colors = [];
				for (var saturation = 0; saturation < 100; saturation++) {
					colors.push('hsl(' + hue + ', ' + saturation + '%, 50%)');
				}

				return colors;
			};

			this.colorIndex = function(country, value) {
				return Math.floor(value / this.maxValue[country] * 100) - 1;
			};
		});
})();