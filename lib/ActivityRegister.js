var ActivityRegister = (function () {
    function ActivityRegister(workflow) {
        this.workflow = workflow;
    }
    ActivityRegister.prototype.getActivityDescriptor = function (name, version) {
        var configEntries = this.workflow.activities.filter(function (item, index, array) {
            if (item.name == name && item.version == version)
                return true;
        });

        if (configEntries.length > 0) {
            return configEntries[0];
        } else {
            throw new Error("Cannot find activity " + name + ":" + version + " in config");
        }
    };

    ActivityRegister.prototype.getActivityDescriptorByRef = function (reference) {
        var configEntries = this.workflow.activities.filter(function (item, index, array) {
            if (item.reference == reference)
                return true;
        });

        if (configEntries.length > 0) {
            return configEntries[0];
        } else {
            throw new Error("Cannot find activity " + reference + " in config");
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
            throw new Error("Cannot find activity " + reference + " in config");
        }
    };
    return ActivityRegister;
})();
exports.ActivityRegister = ActivityRegister;
