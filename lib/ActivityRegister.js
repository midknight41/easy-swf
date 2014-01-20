var errors = require("./CustomErrors");

var ActivityRegister = (function () {
    function ActivityRegister(workflow) {
        if (workflow == null)
            throw new errors.NullArgumentError("workflow cannot be null");

        this.workflow = workflow;
    }
    ActivityRegister.prototype.getActivity = function (name, version) {
        var configEntries = this.workflow.activities.filter(function (item, index, array) {
            if (item.name == name && item.version == version)
                return true;
        });

        if (configEntries.length > 0) {
            return configEntries[0];
        } else {
            throw new errors.InvalidArgumentError("Cannot find activity " + name + ":" + version + " in config");
        }
    };

    ActivityRegister.prototype.getActivityByRef = function (reference) {
        var configEntries = this.workflow.activities.filter(function (item, index, array) {
            if (item.reference == reference)
                return true;
        });

        if (configEntries.length > 0) {
            return configEntries[0];
        } else {
            throw new errors.InvalidArgumentError("Cannot find activity " + reference + " in config");
        }
    };
    return ActivityRegister;
})();
exports.ActivityRegister = ActivityRegister;
