/// <reference path="imports.d.ts" />
var errors = require("./CustomErrors");

var FunctionWrapper = (function () {
    function FunctionWrapper(activity, context) {
        if (activity == null)
            throw new errors.NullArgumentError("activity cannot be null");
        if (context == null)
            throw new errors.NullArgumentError("context cannot be null");

        this.activity = activity;
        this.context = context;
    }
    FunctionWrapper.prototype.getFunction = function () {
        var me = this;

        if (me.activity.hasFailed)
            return me.failed;
        if (me.activity.hasTimedOut)
            return me.timedOut;

        if (me.activity.hasCompleted)
            return function completed(input, clientMethod) {
                clientMethod(null, me.activity.result);
            };

        if (me.activity.hasStarted)
            return me.started;
        if (me.activity.hasBeenScheduled)
            return me.scheduled;

        return function scheduleTask(input, clientMethod) {
            me.context.doActivity(me.activity, input);
        };
    };

    FunctionWrapper.prototype.timedOut = function (input, clientMethod) {
        var error = new Error("TIMEDOUT");
        clientMethod(error, null);
    };

    FunctionWrapper.prototype.failed = function (input, clientMethod) {
        var error = new Error("FAILED");
        clientMethod(error, null);
    };

    FunctionWrapper.prototype.scheduled = function (input, clientMethod) {
        //not sure anything goes here!
    };

    FunctionWrapper.prototype.started = function (input, clientMethod) {
        //not sure anything goes here!
    };
    return FunctionWrapper;
})();
exports.FunctionWrapper = FunctionWrapper;
//# sourceMappingURL=FunctionWrapper.js.map
