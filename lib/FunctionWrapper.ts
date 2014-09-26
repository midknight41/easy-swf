/// <reference path="imports.d.ts" />

import interfaces = require("./Interfaces");
import AWS = require("aws-sdk");
import DataAccess = require("./SwfDataAccess");
import errors = require("./CustomErrors");

export class FunctionWrapper {

  private activity: interfaces.IActivity;
  private context: interfaces.IDecisionContext;

  constructor(activity: interfaces.IActivity, context: interfaces.IDecisionContext) {

    if (activity == null) throw new errors.NullArgumentError("activity cannot be null");
    if (context == null) throw new errors.NullArgumentError("context cannot be null");

    this.activity = activity;
    this.context = context;
  }

  public getFunction(){

    var me = this;

    if (me.activity.hasFailed) return me.failed;
    if (me.activity.hasTimedOut) return me.timedOut;

    if (me.activity.hasCompleted) return function completed(input: string, clientMethod: (err, data) => void) {
      clientMethod(null, me.activity.result);
    };

    if (me.activity.hasStarted) return me.started;
    if (me.activity.hasBeenScheduled) return me.scheduled;

    return function scheduleTask(input: string, clientMethod: (err, data) => void) {

      me.context.doActivity(me.activity, input);

    };
  }

  public timedOut(input: string, clientMethod: (err, data) => void) {
    var error = new Error("TIMEDOUT");
    clientMethod(error, null);
  }

  public failed(input: string, clientMethod: (err, data) => void) {
    var error = new Error("FAILED");
    clientMethod(error, null);

  }

  public scheduled(input: string, clientMethod: (err, data) => void) {
    //not sure anything goes here!
  }

  public started(input: string, clientMethod: (err, data) => void) {
    //not sure anything goes here!
  }
  
}