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

  constructor(register: interfaces.IActivityRegister, domain: string, taskList: string, swf: dal.ISwfDataAccess) {

    this.domain = domain;
    this.swf = swf;
    this.activityRegister = register;
    this.taskList = taskList;
  }

  public handleActivity(reference: string, activityCode?: any) {
    //add this activity to a collection for execution later

    var container: ActivityCallbackContainer = new ActivityCallbackContainer();

    var activity = this.activityRegister.getActivityDescriptorByRef(reference);

    if (activity == null) {
      //workflow is not configured properly.
      throw new Error("A handler cannot be set up for activity '" + reference + "' as it is not in the workflow configuration.");
    }

    container.reference = activity.reference;
    container.activityCode = activityCode;
    container.name = activity.name;
    container.taskList = activity.taskList;
    container.version = activity.version;

    this.activities.push(container);
  }

  //it's confusing what object we are talking about here: we have two different things we refer to as an activity
  //clean this up!
  private getActivityContainer(activityName: string, version: string): ActivityCallbackContainer {

    var activity = this.activityRegister.getActivityDescriptor(activityName, version);

    var containers = this.activities.filter(function (item, index, array) {
      if (item.reference == activity.reference) return item;
    });

    if (containers.length > 0) {
      return containers[0];
    } else {
      return null;
    }

  }

  public listen(feedbackHandler?: (err: Error, message: string) => void) {

    if (feedbackHandler != null)
      this.feedbackHandler = feedbackHandler;
    else
      this.feedbackHandler = function (err:Error, message: string) { };

    this.BeginActivityPolling();
  }

  public stop() {
    this.feedbackHandler(null, "[Activity] stopped polling");
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
      me.feedbackHandler(null, "[Activity] polling response");

      if (error != null) {
        me.feedbackHandler(error, "pollForActivityTask Error:");
        return;
        //emit error
      }

      if (data != null && data.startedEventId > 0) {
        var token = data.taskToken;
        var activity = me.getActivityContainer(data.activityType.name, data.activityType.version);

        if (activity == null) {
          me.feedbackHandler(new Error("There is no activity handler associated with this activity."), "[Activity] executing " + data.activityType.name);
        } else {

          me.feedbackHandler(null, "[Activity] executing " + data.activityType.name);
          activity.activityCode(null, data.input, function (err?: Error, data2?: string) {
            me.proceedAfterActivity(token, err, data2);
          });

        }

      }
      if (me.continuePolling == true) {
        me.doActivityPoll(me, domain, taskList);
      }

    });

  }

  private proceedAfterActivity(taskToken: string, err?: Error, data?: string) {

    var me = this;

    data = data == null ? "" : data;

    if (err == null) {

      me.swf.respondActivityTaskCompleted(taskToken, data, function (err1, data1) {
        if (err1 != null) me.feedbackHandler(err, "ERR:respondActivityTaskCompleted");
      });

    } else {

      me.feedbackHandler(err, "[Activity] sending failure");

      me.swf.respondActivityTaskFailed(taskToken, err.message, function (err2, data2) {
        if (err2 != null) me.feedbackHandler(err, "ERR:respondActivityTaskFailed");

      });
    }
  }

}


export class ActivityCallbackContainer implements interfaces.IActivityDescriptor {

  public name: string;
  public version: string;
  public taskList: string;
  public reference: string;
  public activityCode: (err: any, input: string, callback: (err: Error, data: any) => void) => void;
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

export class ActivityAdapter {
  constructor(desc: interfaces.IActivityDescriptor) {
    this.desc = desc;
  }

  private desc: interfaces.IActivityDescriptor;

  public fill(): Activity {
    var activity = new Activity();

    activity.name = this.desc.name;
    activity.version = this.desc.version;
    activity.taskList = this.desc.taskList;
    activity.reference = this.desc.reference;

    return activity;

  }
}
