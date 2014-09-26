/// <reference path="imports.d.ts" />
var a = require("./Activity");

var errors = require("./CustomErrors");

var EventParser = (function () {
    function EventParser() {
    }
    EventParser.prototype.extractWorkflowInput = function (events) {
        for (var index = 0; index < events.length; index++) {
            var item = events[index];

            if (item.eventType == "WorkflowExecutionStarted") {
                return item.workflowExecutionStartedEventAttributes.input;
            }
        }

        return "";
    };

    EventParser.prototype.extractWorkflowExecutionData = function (events) {
        for (var index = 0; index < events.length; index++) {
            var item = events[index];

            if (item.eventType == "WorkflowExecutionStarted") {
                return {
                    name: item.workflowExecutionStartedEventAttributes.workflowType.name,
                    version: item.workflowExecutionStartedEventAttributes.workflowType.version,
                    input: item.workflowExecutionStartedEventAttributes.input
                };
            }
        }

        return null;
    };

    EventParser.prototype.extractActivities = function (events) {
        if (events == null)
            throw new errors.NullArgumentError("events is mandatory");

        //var events = this.events;
        var activityIndex = [];
        var activities = [];

        //find all activity related events
        var me = this;

        for (var index = 0; index < events.length; index++) {
            var item = events[index];

            if (item.eventType == "ActivityTaskScheduled") {
                var activity = new a.Activity();

                activity.name = item.activityTaskScheduledEventAttributes.activityType.name;
                activity.version = item.activityTaskScheduledEventAttributes.activityType.version;
                activity.taskList = item.activityTaskScheduledEventAttributes.taskList.name;
                activity.input = item.activityTaskScheduledEventAttributes.input;
                activity.hasBeenScheduled = true;

                activities.push(activity);
                activityIndex.push(index + 1);
            }

            if (item.eventType == "ActivityTaskCompleted") {
                var sid = item.activityTaskCompletedEventAttributes.scheduledEventId;
                var activity = activities[activityIndex.indexOf(sid)];

                activity.result = item.activityTaskCompletedEventAttributes.result;
                activity.hasCompleted = true;

                activities[activityIndex.indexOf(sid)] = activity;
            }

            if (item.eventType == "ActivityTaskStarted") {
                var sid = item.activityTaskStartedEventAttributes.scheduledEventId;
                activities[activityIndex.indexOf(sid)].hasStarted = true;
            }

            if (item.eventType == "ActivityTaskFailed") {
                var sid = item.activityTaskFailedEventAttributes.scheduledEventId;
                activities[activityIndex.indexOf(sid)].hasFailed = true;
            }

            if (item.eventType == "ActivityTaskTimedOut") {
                var sid = item.activityTaskTimedOutEventAttributes.scheduledEventId;
                activities[activityIndex.indexOf(sid)].hasTimedOut = true;
            }
        }

        return (activities);
    };
    return EventParser;
})();
exports.EventParser = EventParser;
//# sourceMappingURL=EventParser.js.map
