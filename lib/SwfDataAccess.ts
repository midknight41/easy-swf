/// <reference path="imports.d.ts" />
import AWS = require("aws-sdk");

export var monitor = console;
export var debug = console;

export interface ISwfDataAccess {
    startWorkflowExecution(request: AWS.Swf.StartWorkflowExecutionRequest, callback: (err: Error) => void );
    pollForActivityTask(domain: string, taskList: string, callback: (err: any, data: AWS.Swf.ActivityTask) => void );
    respondActivityTaskCanceled(params: AWS.Swf.RespondActivityTaskCanceledRequest, callback: (err: any, data: any) => void );
    respondActivityTaskCompleted(taskToken: string, data: string, callback: (err: any, data: any) => void );
    respondActivityTaskFailed(taskToken: string, errMessage: string, callback: (err: any, data: any) => void );
    pollForDecisionTask(domain: string, taskList: string, callback: (err: any, data: AWS.Swf.DecisionTask) => void );

    //decision task responses
    respondFailWorkflowExecution(taskToken: string, reason: string, detail: string, callback: (err: any, data: any) => void );
    respondCompleteWorkflowExecution(taskToken: string, callback: (err: any, data: any) => void );
    respondRecordMarker(taskToken: string, callback: (err: any, data: any) => void );
    respondScheduleActivityTask(taskToken: string, decisions: AWS.Swf.Decision[], callback: (err: any, data: any) => void );

}

export class SwfDataAccess implements ISwfDataAccess {
    private swf;
    constructor() {

        this.swf = new AWS.SimpleWorkflow();
    }


    respondScheduleActivityTask(taskToken: string, decisions: AWS.Swf.Decision[], callback: (err: any, data: any) => void) {

        var params: AWS.Swf.RespondDecisionTaskCompletedRequest = {
            taskToken: taskToken,
            decisions: decisions

        };

        this.swf.respondDecisionTaskCompleted(params, function (err, data) {
            callback(err, data);
        });

    }

    respondRecordMarker(taskToken: string, callback: (err: any, data: any) => void ) {

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

        this.swf.client.respondDecisionTaskCompleted(params, function (err, data) {
            callback(err, data);

        });


    }
    respondCompleteWorkflowExecution(taskToken: string, callback: (err: any, data: any) => void ) {
        
        var decision: AWS.Swf.Decision = {
            decisionType: "CompleteWorkflowExecution"
        };

        var params: AWS.Swf.RespondDecisionTaskCompletedRequest = {
            taskToken:taskToken,
            decisions: [decision]

        };

        this.swf.client.respondDecisionTaskCompleted(params, function (err, data) {
            callback(err, data);
        });

    }

    respondFailWorkflowExecution(taskToken: string, reason: string, detail: string, callback: (err: any, data: any) => void) {

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

        this.swf.client.respondDecisionTaskCompleted(params, function (err, data) {
            callback(err, data);
        });
    }

    public respondActivityTaskCanceled(params: AWS.Swf.RespondActivityTaskCanceledRequest, callback: (err: any, data: any) => void ) {

        this.swf.client.respondActivityTaskCanceled(params, function (err, data) {
            callback(err, data);
        });
    
    }

    public respondActivityTaskCompleted(taskToken: string, data: string, callback: (err: any, data: any) => void ) {

        var params: AWS.Swf.RespondActivityTaskCompletedRequest = {
            taskToken: taskToken,
            result: data
        };
            
        this.swf.client.respondActivityTaskCompleted(params, function (err, data) {
            callback(err, data);
        });

    }

    public respondActivityTaskFailed(taskToken: string, errMessage: string, callback: (err: any, data: any) => void ) {
        
        var failedParams: AWS.Swf.RespondActivityTaskFailedRequest = {
            taskToken: taskToken,
            reason: errMessage
        };
        
        this.swf.respondActivityTaskFailed(failedParams, function (err, data) {
            debug.log("ERR:respondActivityTaskFailed ", err);

        });
    }

    public pollForDecisionTask(domain: string, taskList: string, callback) {

        var request = {
            domain: domain,
            taskList: { name: taskList }
        };


        this.swf.client.pollForDecisionTask(request, function (error, data) {
            callback(error, data);
        });
    }

    
    public pollForActivityTask(domain: string, taskList: string, callback) {

        var request = {
            domain: domain,
            taskList: { name: taskList }
        };


        this.swf.client.pollForActivityTask(request, function (error, data) {
            callback(error, data);
        });
    }

    public startWorkflowExecution(request: AWS.Swf.StartWorkflowExecutionRequest, callback: (err: Error) => void) {
                
        this.swf.client.startWorkflowExecution(request, function (error, data) {
            monitor.log("[Workflow] starting", request.domain);

            if (error == null) {

            } else {
                debug.log("startWorkflowExecution - error:", error);
                callback(error);
            }
        });

    }

}
