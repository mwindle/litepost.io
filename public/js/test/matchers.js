
/**
* Custom matchers
*/
(function () {
	'use strict';


	/**
	* Setup data-only equals comparison to ignore injected $resource methods when comparing
	* mocked objects
	*/
	beforeEach(function () {
		jasmine.addMatchers({
			toEqualData: function(util, customEqualityTesters) {
				return {
					compare: function(actual, expected) {
						return {
							pass: angular.equals(actual, expected)
						};
					}
				};
			}
		});
	});
})();
