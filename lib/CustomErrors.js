var NullArgumentError = (function () {
    function NullArgumentError(message) {
        this.name = "NullArgumentError";
        this.message = message;

        var errMod = Error;
        errMod.captureStackTrace(this, InvalidArgumentError);
    }
    return NullArgumentError;
})();
exports.NullArgumentError = NullArgumentError;

require('util').inherits(NullArgumentError, Error);

var InvalidArgumentError = (function () {
    function InvalidArgumentError(message) {
        this.name = "InvalidArgumentError";
        this.message = message;

        var errMod = Error;
        errMod.captureStackTrace(this, InvalidArgumentError);
    }
    return InvalidArgumentError;
})();
exports.InvalidArgumentError = InvalidArgumentError;

require('util').inherits(InvalidArgumentError, Error);
