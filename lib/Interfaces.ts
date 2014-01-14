
export interface IActivityDescriptor {
  name: string;
  version: string;
  taskList: string;
  reference: string;
}

export interface IActivity extends IActivityDescriptor {
  result: string;
  input: string;
  hasStarted: boolean;
  hasCompleted: boolean;
  hasBeenScheduled: boolean;
  hasFailed: boolean;
  hasTimedOut: boolean;
}

export interface IActivityRegister {
  getActivityDescriptor(name: string, version: string): IActivityDescriptor;
  getActivityDescriptorByRef(reference: string): IActivityDescriptor;
  getActivityByRef(reference: string): IActivity;
}

export interface IDomainConfig {
  domain: string;
  taskList: string;
}

export interface IOptions extends IDomainConfig {
  reference: string;
  workflowType: string;
  workflowTypeVersion: string;
  taskList: string;
  activities: IActivity[];
}

export interface IDecisionContext {

  lastActivity(): IActivity;
  //doActivityByName(activityName: string, version: string, taskList: string, data?: string);
  getMatchingActivities(reference: string): IActivity[];
  getFunction(activityRef: string): any;
  getActivityState(reference: string): IActivity;
  doActivity(activity: IActivity, data?: string);
  failWorkflow(err: Error);
  allDone();

}