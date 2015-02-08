var errors = require("./CustomErrors");
var ActivityRegister = (function () {
    function ActivityRegister(workflow) {
        if (workflow == null)
            throw new errors.NullOrEmptyArgumentError("workflow cannot be null");
        if (workflow.activities == null)
            workflow.activities = [];
        this.workflow = workflow;
    }
    ActivityRegister.prototype.registerActivity = function (name, version, taskList) {
        var configEntries = this.workflow.activities.filter(function (item, index, array) {
            if (item.name == name && item.version == version)
                return true;
        });
        if (configEntries.length == 0) {
            var activity = {
                name: name,
                version: version,
                taskList: taskList,
                reference: name + "(" + version + ")"
            };
            this.workflow.activities.push(activity);
            return activity;
        }
        else {
            throw new errors.BadConfigError("Activity " + name + "(" + version + ") already exists.");
        }
    };
    ActivityRegister.prototype.getActivity = function (name, version) {
        var configEntries = this.workflow.activities.filter(function (item, index, array) {
            if (item.name == name && item.version == version)
                return true;
        });
        if (configEntries.length > 0) {
            return configEntries[0];
        }
        else {
            return null; //throw new errors.InvalidArgumentError("Cannot find activity " + name + "(" + version + ") in config");
        }
    };
    ActivityRegister.prototype.getActivityByRef = function (reference) {
        var configEntries = this.workflow.activities.filter(function (item, index, array) {
            if (item.reference == reference)
                return true;
        });
        if (configEntries.length > 0) {
            return configEntries[0];
        }
        else {
            throw new errors.InvalidArgumentError("Cannot find activity " + reference + " in config");
        }
    };
    return ActivityRegister;
})();
exports.ActivityRegister = ActivityRegister;
//# sourceMappingURL=ActivityRegister.js.map