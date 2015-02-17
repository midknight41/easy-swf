import AWS = require("aws-sdk");
import uuid = require("uuid");

export function buildScheduleActivityTask(input: string, activityName: string, version: string, taskList: string): AWS.Swf.Decision {

  var decision: AWS.Swf.Decision = {
    decisionType: "ScheduleActivityTask",
    scheduleActivityTaskDecisionAttributes: {
      activityId: uuid.v4(),
      input: input,
      activityType:
      {
        name: activityName,
        version: version
      },
      taskList: { name: taskList }
    }
  };

  return decision;
}

export function buildRecordMarker(markerName: string): AWS.Swf.Decision {

  var attr: AWS.Swf.RecordMarkerDecisionAttributes = {
    markerName: markerName
  };

  var decision: AWS.Swf.Decision = {
    decisionType: "RecordMarker",
    recordMarkerDecisionAttributes: attr
  };

  return decision;

}

export function buildCompleteWorkflowExecution(): AWS.Swf.Decision {

  var decision: AWS.Swf.Decision = {
    decisionType: "CompleteWorkflowExecution"
  };

  return decision;

}

export function buildFailWorkflowExecution(reason: string, detail: string): AWS.Swf.Decision {

  var attr: AWS.Swf.FailWorkflowExecutionDecisionAttributes = {
    reason: reason,
    details: detail
  };

  var decision: AWS.Swf.Decision = {
    decisionType: "FailWorkflowExecution",
    failWorkflowExecutionDecisionAttributes: attr
  };

  return decision;
}

