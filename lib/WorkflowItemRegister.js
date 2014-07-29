var errors = require("./CustomErrors");

var WorkflowItemRegister = (function () {
    function WorkflowItemRegister() {
        this.workflowItems = [];
    }
    WorkflowItemRegister.prototype.addItem = function (reference, name, version, taskList, callback) {
        var item = new WorkflowCallbackContainer();

        item.reference = reference;
        item.name = name;
        item.version = version;
        item.taskList = taskList;
        item.code = callback;

        this.workflowItems.push(item);
    };

    WorkflowItemRegister.prototype.getItem = function (name, version) {
        var configEntries = this.workflowItems.filter(function (item, index, array) {
            if (item.name == name && item.version == version)
                return true;
        });

        if (configEntries.length > 0) {
            return configEntries[0];
        } else {
            throw new errors.InvalidArgumentError("Cannot find workflow item " + name + ":" + version + " in register");
        }
    };

    WorkflowItemRegister.prototype.getItemByRef = function (reference) {
        var configEntries = this.workflowItems.filter(function (item, index, array) {
            if (item.reference == reference)
                return true;
        });

        if (configEntries.length > 0) {
            return configEntries[0];
        } else {
            throw new errors.InvalidArgumentError("Cannot find workflow item " + reference + " in register");
        }
    };
    return WorkflowItemRegister;
})();
exports.WorkflowItemRegister = WorkflowItemRegister;

var WorkflowCallbackContainer = (function () {
    function WorkflowCallbackContainer() {
    }
    return WorkflowCallbackContainer;
})();
