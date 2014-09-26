export interface IWorkflowItem {
  name: string;
  version: string;
  taskList: string;
  reference: string;
  code?: any;
}

export interface IActivity extends IWorkflowItem {
  result?: string;
  input?: string;
  hasStarted?: boolean;
  hasCompleted?: boolean;
  hasBeenScheduled?: boolean;
  hasFailed?: boolean;
  hasTimedOut?: boolean;
}

export interface IActivityRegister {
  getActivityByRef(reference: string): IActivity;
  getActivity(name: string, version: string): IActivity;
}

export interface IWorkflowItemRegister {
  addItem(reference: string, name: string, version: string, taskList: string, callback: any);
  getItem(name: string, version: string): IWorkflowItem;
  getItemByRef(reference: string): IWorkflowItem;
}

export interface IWorkflowExecutionData {
  name: string;
  version: string;
  input: string;
}

export interface IDomainConfig {
  domain: string;
  taskList: string;
}

export interface IOptions extends IDomainConfig {
  reference?: string;
  workflowType?: string;
  workflowTypeVersion?: string;
  activities?: IActivity[];
}

export interface IDecisionContext {

  lastActivity(): IActivity;
  doActivity(activity: IActivity, data?: string);
  //doActivityByName(activityName: string, version: string, taskList: string, data?: string);
  getMatchingActivities(reference: string): IActivity[];
  getFunction(name: string, version: string): any;
  getActivityState(name: string, version: string): IActivity;
  failWorkflow(err: Error);
  completeWorkflow();

}