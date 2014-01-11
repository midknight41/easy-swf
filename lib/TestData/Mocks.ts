/// <reference path="../imports.d.ts" />

import interfaces = require("../Interfaces");

export class DecisionContext implements interfaces.IDecisionContext {

  public lastActivity(): interfaces.IActivity { return null; }
  public doActivityByName(activityName: string, version: string, taskList: string, data?: string) { }
  public getMatchingActivities(reference: string): interfaces.IActivity[] { return null; }
  public getFunction(activityRef: string): Function { return null;  }
  public getActivityState(reference: string): interfaces.IActivity { return null;  }
  public doActivity(activity: interfaces.IActivity, data?: string) { }
  public failWorkflow(err: Error) { }
  public allDone() { }


}

export function make<T>(): T {
  return null;
}