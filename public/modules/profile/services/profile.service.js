/*
* Services for the profile module
*/
(function () {
	'use strict';

	angular.module('profile')

	.directive('onlyLowerLettersAndNumbers', function () {
		var onlyLowerLettersAndNumbers = /^[a-z0-9]*$/;
		return {
			require: 'ngModel',
			link: function (scope, elm, attrs, ctrl) {
				ctrl.$validators.onlyLowerLettersAndNumbers = function (modelValue, viewValue) {
					return onlyLowerLettersAndNumbers.test(viewValue);
				};
			}
		};
	})

	.directive('password', function () {
		var hasNumber = /\d/;
		var hasLowerLetter = /[a-z]/;
		var hasUpperLetter = /[A-Z]/;
		return {
			require: 'ngModel',
			link: function (scope, elm, attrs, ctrl) {
				ctrl.$validators.hasNumber = function (modelValue, viewValue) {
					return hasNumber.test(viewValue);
				};
				ctrl.$validators.hasLowerLetter = function (modelValue, viewValue) {
					return hasLowerLetter.test(viewValue);
				};
				ctrl.$validators.hasUpperLetter = function (modelValue, viewValue) {
					return hasUpperLetter.test(viewValue);
				};
			}
		};
	})

	.directive('username', function ($q, User) {
		return {
			require: 'ngModel',
			link: function (scope, elm, attrs, ctrl) {
				ctrl.$asyncValidators.username = function (modelValue, viewValue) {
					
					if (ctrl.$isEmpty(modelValue)) {
          	// consider empty model valid
          	return $q.when();
        	}

					var def = $q.defer();
					User.get({ username: modelValue }, function (user) {
						def.reject();
					}, function (err) {
						if(err.status === 404) {
							def.resolve();
						} else {
							def.reject();
						}
					});
					return def.promise;
				};
			}
		};
	})

	.directive('emailUnique', function ($q, User) {
		return {
			require: 'ngModel',
			link: function (scope, elm, attrs, ctrl) {
				ctrl.$asyncValidators.emailUnique = function (modelValue, viewValue) {
					
					if (ctrl.$isEmpty(modelValue)) {
          	// consider empty model valid
          	return $q.when();
        	}

					var def = $q.defer();
					User.get({ email: modelValue }, function (user) {
						def.reject();
					}, function (err) {
						if(err.status === 404) {
							def.resolve();
						} else {
							def.reject();
						}
					});
					return def.promise;
				};
			}
		};
	});
	
})();
