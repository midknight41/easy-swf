/// <reference path="imports.d.ts" />

import AWS = require("aws-sdk");
import dal = require("./SwfDataAccess");
import interfaces = require("./Interfaces");

export class ActivityHost {

  private activityRegister: interfaces.IActivityRegister;
  public taskList: string;
  private domain: string;
  private activities = [];
  private swf: dal.ISwfDataAccess;
  private feedbackHandler: (err: Error, message: string) => void;
  private continuePolling: boolean;
  private lastHeartbeat: number;
  private heartId: number;
  private whenStopped: (err: Error) => void;

  constructor(register: interfaces.IActivityRegister, domain: string, taskList: string, swf: dal.ISwfDataAccess) {

    this.domain = domain;
    this.swf = swf;
    this.activityRegister = register;
    this.taskList = taskList;
  }

  public handleActivity(name: string, version: string, activityCode?: any) {

    var container: WorkflowCallbackContainer = new WorkflowCallbackContainer();

    var activity = this.activityRegister.getActivity(name, version);

    if (activity == null) {
      //workflow is not configured properly.
      throw new Error("A handler cannot be set up for activity '" + name + "' as it is not in the workflow configuration.");
    }

    container.reference = activity.reference;
    container.code = activityCode;
    container.name = activity.name;
    container.taskList = activity.taskList;
    container.version = activity.version;

    this.activities.push(container);
  }

  private getActivityContainer(activityName: string, version: string): WorkflowCallbackContainer {

    var activity = this.activityRegister.getActivity(activityName, version);

    var containers = this.activities.filter(function (item, index, array) {
      if (item.reference == activity.reference) return item;
    });

    if (containers.length > 0) {
      return containers[0];
    } else {
      return null;
    }

  }

  private createHeartbeatWrapper(feedbackHandler: (err: Error, message: string) => void): any {

    var me = this;
    
    return function (err: Error, message: string) {

      var check: number = Date.now();
      var threeMinutes = 180000;

      feedbackHandler(err, message);

      if (check - me.lastHeartbeat > threeMinutes) {

        feedbackHandler(null, "[Activity] Heartbeat detected error! Restarting service.");

        //me.stop();
        //me.start();

        throw new Error("Heartbeat failed! SWF has become unresponsive.");

      }

      this.lastHeartbeat = check;
    }

  }


  public listen(feedbackHandler?: (err: Error, message: string) => void) {

    if (feedbackHandler != null)
      this.feedbackHandler = this.createHeartbeatWrapper(feedbackHandler);
    else
      this.feedbackHandler = this.createHeartbeatWrapper(function (err: Error, message: string) { });

    this.start();
    
  }

  private start() {
    var me = this;

    me.lastHeartbeat = Date.now();

    me.heartId = setInterval(function () {

      me.feedbackHandler(null, "[Activity] Heartbeat check");
    }, 200000);

    me.BeginActivityPolling();
  }

  public stop(callback?: (err: Error) => void) {
    this.feedbackHandler(null, "[Activity] stopped polling");

    if (this.heartId != null) {
      clearInterval(this.heartId);
    }

    this.whenStopped = callback;
    this.continuePolling = false;
  }

  private BeginActivityPolling() {

    var me = this;
    me.continuePolling = true;
    me.doActivityPoll(me, me.domain, me.taskList);

  }

  private doActivityPoll(me: ActivityHost, domain: string, taskList: string) {

    me.feedbackHandler(null, "[Activity] looking for activities");

    me.swf.pollForActivityTask(domain, taskList, function (error, data) {

      if (error != null) {

        me.feedbackHandler(error, "[Activity] unexpected polling response error - " + error.message);

      }

      me.feedbackHandler(null, "[Activity] polling response");

      if (data != null && data.startedEventId > 0) {
        var token = data.taskToken;
        var container = me.getActivityContainer(data.activityType.name, data.activityType.version);

        if (container == null) {
          me.feedbackHandler(new Error("There is no activity handler associated with this activity."), "[Activity] executing " + data.activityType.name);
        } else {

          me.feedbackHandler(null, "[Activity] executing " + data.activityType.name + " for " + data.workflowExecution.workflowId);

          var activityState: interfaces.IActivityState = {
            workflowId: data.workflowExecution.workflowId,
            input: data.input,
            name: container.name,
            reference: container.reference,
            version: container.version,
            taskList: container.taskList
          };

          container.code(activityState, data.input, function next(err?: Error, result?: string) {
            me.proceedAfterActivity(data.activityType.name, data.activityType.version, token, err, result);
          });

        }

      } else {
        me.feedbackHandler(null, "[Activity] nothing to do");
      }

      if (me.continuePolling == true) {
        me.doActivityPoll(me, domain, taskList);
      } else {
        if (me.whenStopped != null) {
          me.whenStopped(null);
        }
      }

    });

  }

  private proceedAfterActivity(activityName: string, activityVersion: string, taskToken: string, err?: Error, data?: string) {

    var me = this;

    data = data == null ? "" : data;

    if (err == null) {

      me.swf.respondActivityTaskCompleted(taskToken, data, function (err1, data1) {
        if (err1 != null) {
          me.feedbackHandler(err1, "[Activity] error occurred when marking " + activityName + " as complete");
        } else {
          me.feedbackHandler(null, "[Activity] completed " + activityName);
        }
      });

    } else {

      me.feedbackHandler(err, "[Activity] sending failure");

      me.swf.respondActivityTaskFailed(taskToken, err.message, function (err2, data2) {
        if (err2 != null) me.feedbackHandler(err2, "ERR:respondActivityTaskFailed");

      });
    }
  }

}

export class WorkflowCallbackContainer implements interfaces.IActivity {
  public workflowId: string;
  public name: string;
  public version: string;
  public taskList: string;
  public reference: string;
  public code: (activity: interfaces.IActivityState, input: string, callback: (err: Error, data: any) => void) => void;
}

export class Activity implements interfaces.IActivity {
  public reference: string;
  public name: string;
  public version: string;
  public taskList: string;
  public result: string;
  public input: string;
  public hasStarted: boolean = false;
  public hasCompleted: boolean = false;
  public hasBeenScheduled: boolean = false;
  public hasFailed: boolean = false;
  public hasTimedOut: boolean = false;

}