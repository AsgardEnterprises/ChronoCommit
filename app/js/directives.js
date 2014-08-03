(function() {

	'use strict';

	/* Directives */

	/**
	 * This directive exists to hold the large world map
	 * visualisation. This creates its own containing div
	 * and fills itself using the DataMap library.
	 *
	 * Additionally some scope watching occurs, and a
	 * redraw happens if the data service changes.
	 */
	angular.module('chronoCommit.directives', [])
		.directive('worldMap', ['colorService',
			function(colorService) {
				function link(scope, element, attrs) {
					element[0].style.position = 'fixed';
					element[0].style.display = 'block';
					element[0].style.width = '100%';
					element[0].style.height = '100%';

					var testMap = new Datamap({
						element: element[0],
						defaultFill: 'hsl(206,0%,50%)',
						fills: colorService.getColorPalette(206),
						projection: 'mercator',
						redrawOnResize: true,
						data: {},
						geographyConfig: {
							popupTemplate: function(geo, data) {
								var hoverinfo = ['<div class="hoverinfo"><strong>' + geo.properties.name + '</strong><br/>'];
								if (data === null) {
									hoverinfo.push('No data');
								} else {
									hoverinfo.push(data.numberOfThings + ' commits');
								}

								hoverinfo.push('</div>');
								return hoverinfo.join('');

							}
						}
					});

					/**
					 * Watch the countries value (data bound to
					 * the controller) and if it does, update the
					 * map drawing.
					 * @param  {} newValue - Value the object changed to
					 * @param  {} oldValue - Value the object changed from
					 */
					scope.$watchCollection('countries', function(newValue, oldValue) {
						if (newValue) {
							testMap.updateChoropleth(newValue);
						}
					});
				}

				return {
					restrict: ' E ',
					scope: {
						countries: ' = '
					},
					link: link
				};
			}
		])
		.directive('timeSlider', function() {

			function link(scope, element, attrs) {
				var margin = {
						top: 10,
						right: 25,
						bottom: 10,
						left: 25
					},
					width = 500 - margin.left - margin.right,
					height = 100 - margin.bottom - margin.top;

				var x = d3.scale.linear()
					.domain([0, 168])
					.range([0, width])
					.clamp(true);

				var brush = d3.svg.brush()
					.x(x)
					.extent([0, 0])
					.on("brush", brushed);

				var svg = d3.select(element[0]).append("svg")
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom)
					.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				svg.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + height / 2 + ")")
					.call(d3.svg.axis()
						.scale(x)
						.orient("bottom")
						.tickFormat(function(d, i) {
							var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
							return days[i];
						})
						.tickValues([0, 24, 48, 72, 96, 120, 144, 168])
						.tickSize(0)
						.tickPadding(12))
					.select(".domain")
					.select(function() {
						return this.parentNode.appendChild(this.cloneNode(true));
					})
					.attr("class", "halo");

				var slider = svg.append("g")
					.attr("class", "slider")
					.call(brush);

				slider.selectAll(".extent,.resize")
					.remove();

				slider.select(".background")
					.attr("height", height);

				var handle = slider.append("circle")
					.attr("class", "handle")
					.attr("transform", "translate(0," + height / 2 + ")")
					.attr("r", 9);

				slider
					.call(brush.event)
					.transition() // gratuitous intro!
				.duration(750)
					.call(brush.extent([scope.sliderPosition, scope.sliderPosition]))
					.call(brush.event);

				function brushed() {
					var value = brush.extent()[0];

					if (d3.event.sourceEvent) { // not a programmatic event
						value = x.invert(d3.mouse(this)[0]);
						scope.$apply(function() {
							scope.sliderPosition = value;
						});
						brush.extent([value, value]);
					}

					handle.attr("cx", x(value));
				}
			}

			return {
				restrict: ' E ',
				scope: {
					sliderPosition: ' = '
				},
				link: link
			};

		});
})();