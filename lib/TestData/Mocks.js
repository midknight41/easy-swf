/// <reference path="../imports.d.ts" />
var DecisionContext = (function () {
    function DecisionContext() {
    }
    DecisionContext.prototype.lastActivity = function () {
        return null;
    };
    DecisionContext.prototype.doActivityByName = function (activityName, version, taskList, data) {
    };
    DecisionContext.prototype.getMatchingActivities = function (reference) {
        return null;
    };
    DecisionContext.prototype.getFunction = function (activityRef) {
        return null;
    };
    DecisionContext.prototype.getActivityState = function (reference) {
        return null;
    };
    DecisionContext.prototype.doActivity = function (activity, data) {
    };
    DecisionContext.prototype.failWorkflow = function (err) {
    };
    DecisionContext.prototype.allDone = function () {
    };
    return DecisionContext;
})();
exports.DecisionContext = DecisionContext;

function make() {
    return null;
}
exports.make = make;
//# sourceMappingURL=Mocks.js.map
