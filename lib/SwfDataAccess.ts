/// <reference path="imports.d.ts" />
import AWS = require("aws-sdk");

export var monitor = console;
export var debug = console;

export interface ISwfDataAccess {
  startWorkflowExecution(request: AWS.Swf.StartWorkflowExecutionRequest, callback: (err: Error) => void);
  pollForActivityTask(domain: string, taskList: string, callback: (err: any, data: AWS.Swf.ActivityTask) => void);
  respondActivityTaskCanceled(params: AWS.Swf.RespondActivityTaskCanceledRequest, callback: (err: any, data: any) => void);
  respondActivityTaskCompleted(taskToken: string, data: string, callback: (err: any, data: any) => void);
  respondActivityTaskFailed(taskToken: string, errMessage: string, callback: (err: any, data: any) => void);
  pollForDecisionTask(domain: string, taskList: string, callback: (err: any, data: AWS.Swf.DecisionTask) => void);

  //decision task responses
  respondFailWorkflowExecution(taskToken: string, reason: string, detail: string, callback: (err: any, data: any) => void);
  respondCompleteWorkflowExecution(taskToken: string, callback: (err: any, data: any) => void);
  respondRecordMarker(taskToken: string, callback: (err: any, data: any) => void);
  respondScheduleActivityTask(taskToken: string, decisions: AWS.Swf.Decision[], callback: (err: any, data: any) => void);

}

export class SwfDataAccess implements ISwfDataAccess {
  private swf;
  constructor() {

    this.swf = new AWS.SimpleWorkflow();
  }


  respondScheduleActivityTask(taskToken: string, decisions: AWS.Swf.Decision[], callback: (err: any, data: any) => void) {

    //debug.log("respondScheduleActivityTask", taskToken);

    var params: AWS.Swf.RespondDecisionTaskCompletedRequest = {
      taskToken: taskToken,
      decisions: decisions

    };

    var me = this;

    this.swf.respondDecisionTaskCompleted(params, function (err, data) {

      retryOnNetworkError(err, data,
        function retry() {
          me.respondScheduleActivityTask(taskToken, decisions, callback);
        },
        function proceed(err2, data2) {
          callback(err2, data2);
        });

    });

  }

  respondRecordMarker(taskToken: string, callback: (err: any, data: any) => void) {

    //debug.log("respondRecordMarker", taskToken);

    var attr: AWS.Swf.RecordMarkerDecisionAttributes = {
      markerName: "NoActionFromThisDecision"
    };

    var decision: AWS.Swf.Decision = {
      decisionType: "RecordMarker",
      recordMarkerDecisionAttributes: attr
    };

    var params: AWS.Swf.RespondDecisionTaskCompletedRequest = {
      taskToken: taskToken,
      decisions: [decision]
    };

    var me = this;

    this.swf.respondDecisionTaskCompleted(params, function (err, data) {

      retryOnNetworkError(err, data,
        function retry() {
          me.respondRecordMarker(taskToken, callback);
        },
        function proceed(err2, data2) {
          callback(err2, data2);
        });

    });

  }

  respondCompleteWorkflowExecution(taskToken: string, callback: (err: any, data: any) => void) {

    //debug.log("respondCompleteWorkflowExecution", taskToken);

    var decision: AWS.Swf.Decision = {
      decisionType: "CompleteWorkflowExecution"
    };

    var params: AWS.Swf.RespondDecisionTaskCompletedRequest = {
      taskToken: taskToken,
      decisions: [decision]

    };

    var me = this;

    this.swf.respondDecisionTaskCompleted(params, function (err, data) {

      retryOnNetworkError(err, data,
        function retry() {
          me.respondCompleteWorkflowExecution(taskToken, callback);
        },
        function proceed(err2, data2) {
          callback(err2, data2);
        });

    });


  }

  respondFailWorkflowExecution(taskToken: string, reason: string, detail: string, callback: (err: any, data: any) => void) {

    //debug.log("respondFailWorkflowExecution", taskToken);

    var attr: AWS.Swf.FailWorkflowExecutionDecisionAttributes = {
      reason: reason,
      details: detail
    };

    var decision: AWS.Swf.Decision = {
      decisionType: "FailWorkflowExecution",
      failWorkflowExecutionDecisionAttributes: attr
    };

    var params: AWS.Swf.RespondDecisionTaskCompletedRequest = {
      taskToken: taskToken,
      decisions: [decision]
    };

    var me = this;

    this.swf.respondDecisionTaskCompleted(params, function (err, data) {

      retryOnNetworkError(err, data,
        function retry() {
          me.respondFailWorkflowExecution(taskToken, reason, detail, callback);
        },
        function proceed(err2, data2) {
          callback(err2, data2);
        });

    });


  }

  public respondActivityTaskCanceled(params: AWS.Swf.RespondActivityTaskCanceledRequest, callback: (err: any, data: any) => void) {

    //debug.log("respondActivityTaskCanceled", params.taskToken);

    this.swf.respondActivityTaskCanceled(params, function (err, data) {
      callback(err, data);
    });

  }

  public respondActivityTaskCompleted(taskToken: string, result: string, callback: (err: any, data: any) => void) {

    //debug.log("respondActivityTaskCompleted", taskToken);
    
    var params: AWS.Swf.RespondActivityTaskCompletedRequest = {
      taskToken: taskToken,
      result: result
    };

    var me = this;

    this.swf.respondActivityTaskCompleted(params, function (err, data) {

      retryOnNetworkError(err, data,
        function retry() {
          me.respondActivityTaskCompleted(taskToken, result, callback);
        },
        function proceed(err2, data2) {
          callback(err2, data2);
        });

    });

  }

  public respondActivityTaskFailed(taskToken: string, errMessage: string, callback: (err: Error, data: any) => void) {

    //debug.log("respondActivityTaskFailed", taskToken);

    var failedParams: AWS.Swf.RespondActivityTaskFailedRequest = {
      taskToken: taskToken,
      reason: errMessage
    };

    var me = this;

    this.swf.respondActivityTaskFailed(failedParams, function (error, data) {

      retryOnNetworkError(error, data,
        function retry() {
          me.respondActivityTaskFailed(taskToken, errMessage, callback);
        },
        function proceed(err2, data2) {
          callback(err2, data2);
        });

    });


    //this.swf.respondActivityTaskFailed(failedParams, function (err, data) {
    //  //debug.log("ERR:respondActivityTaskFailed ", err);

    //});
  }

  public pollForDecisionTask(domain: string, taskList: string, callback) {

    //debug.log("pollForDecisionTask");

    var request = {
      domain: domain,
      taskList: { name: taskList }
    };

    var me = this;

    this.swf.pollForDecisionTask(request, function (error, data) {

      retryOnNetworkError(error, data,
        function retry() {
          me.pollForDecisionTask(domain, taskList, callback);
        },
        function proceed(err2, data2) {
          callback(err2, data2);
        });


    });
  }


  public pollForActivityTask(domain: string, taskList: string, callback) {

    //debug.log("pollForActivityTask");

    var request = {
      domain: domain,
      taskList: { name: taskList }
    };

    var me = this;

    this.swf.pollForActivityTask(request, function (error, data) {

      retryOnNetworkError(error, data,
        function retry() {
          me.pollForActivityTask(domain, taskList, callback);
        },
        function proceed(err2, data2) {
          callback(err2, data2);
        });

    });

  }

  public startWorkflowExecution(request: AWS.Swf.StartWorkflowExecutionRequest, callback: (err: Error) => void) {


    //debug.log("startWorkflowExecution", request.input);

    var me = this;

    this.swf.startWorkflowExecution(request, function (error, data) {

      retryOnNetworkError(error, data,
        function retry() {
          me.startWorkflowExecution(request, callback);
        },
        function proceed(err2, data2) {
          callback(err2);
        });

    });

  }

}

function retryOnNetworkError(error: Error, data: any, retry: () => void, proceed: (err, data) => void) {

  if (error != null) {

    if (error.name == "NetworkingError") {
      console.log("[easy-swf] networking error. Will retry in 30 seconds...");

      setTimeout(function () {
        retry();
      }, 30000);


      return;
    }

  }

  proceed(error, data);

}