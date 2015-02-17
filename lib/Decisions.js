var uuid = require("uuid");
function buildScheduleActivityTask(input, activityName, version, taskList) {
    var decision = {
        decisionType: "ScheduleActivityTask",
        scheduleActivityTaskDecisionAttributes: {
            activityId: uuid.v4(),
            input: input,
            activityType: {
                name: activityName,
                version: version
            },
            taskList: { name: taskList }
        }
    };
    return decision;
}
exports.buildScheduleActivityTask = buildScheduleActivityTask;
function buildRecordMarker(markerName) {
    var attr = {
        markerName: markerName
    };
    var decision = {
        decisionType: "RecordMarker",
        recordMarkerDecisionAttributes: attr
    };
    return decision;
}
exports.buildRecordMarker = buildRecordMarker;
function buildCompleteWorkflowExecution() {
    var decision = {
        decisionType: "CompleteWorkflowExecution"
    };
    return decision;
}
exports.buildCompleteWorkflowExecution = buildCompleteWorkflowExecution;
function buildFailWorkflowExecution(reason, detail) {
    var attr = {
        reason: reason,
        details: detail
    };
    var decision = {
        decisionType: "FailWorkflowExecution",
        failWorkflowExecutionDecisionAttributes: attr
    };
    return decision;
}
exports.buildFailWorkflowExecution = buildFailWorkflowExecution;
//# sourceMappingURL=Decisions.js.map