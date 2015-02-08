import interfaces = require("./Interfaces");
import errors = require("./CustomErrors");

export class WorkflowItemRegister implements interfaces.IWorkflowItemRegister {
  private workflowItems: interfaces.IWorkflowItem[]

  constructor() {
    this.workflowItems = [];
  }

  public addItem(reference: string, name: string, version: string, taskList: string, callback: any) {

    var item: WorkflowCallbackContainer = new WorkflowCallbackContainer();

    item.reference = reference;
    item.name = name;
    item.version = version;
    item.taskList = taskList;
    item.code = callback;

    this.workflowItems.push(item);

  }

  public getItem(name: string, version: string): interfaces.IWorkflowItem {

    var configEntries = this.workflowItems.filter(function (item, index, array) {
      if (item.name == name && item.version == version) return true;
    });

    if (configEntries.length > 0) {
      return configEntries[0];

    } else {
      throw new errors.InvalidArgumentError("cannot find workflow item " + name + ":" + version + " in register");
    }

  }

  public getItemByRef(reference: string): interfaces.IWorkflowItem {

    var configEntries = this.workflowItems.filter(function (item, index, array) {
      if (item.reference == reference) return true;
    });

    if (configEntries.length > 0) {
      return configEntries[0];
    } else {
      throw new errors.InvalidArgumentError("cannot find workflow item by ref " + reference + " in register");
    }

  }

}

class WorkflowCallbackContainer implements interfaces.IWorkflowItem {

  public name: string;
  public version: string;
  public taskList: string;
  public reference: string;
  public code: any;
}
