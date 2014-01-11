var NullArgumentError = (function () {
    function NullArgumentError(message) {
        this.name = "NullArgumentError";
        this.message = message;
    }
    return NullArgumentError;
})();
exports.NullArgumentError = NullArgumentError;

var InvalidArgumentError = (function () {
    function InvalidArgumentError() {
        this.name = "InvalidArgumentError";
    }
    return InvalidArgumentError;
})();
exports.InvalidArgumentError = InvalidArgumentError;
