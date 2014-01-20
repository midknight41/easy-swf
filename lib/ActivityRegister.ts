import interfaces = require("./Interfaces");
import errors = require("./CustomErrors");

export class ActivityRegister implements interfaces.IActivityRegister {
  private workflow: interfaces.IOptions;

  constructor(workflow: interfaces.IOptions) {

    if (workflow == null) throw new errors.NullArgumentError("workflow cannot be null");

    this.workflow = workflow;
  }

  public getActivity(name: string, version: string): interfaces.IActivity {

    var configEntries = this.workflow.activities.filter(function (item, index, array) {
      if (item.name == name && item.version == version) return true;
    });

    if (configEntries.length > 0) {
      return configEntries[0];

    } else {
      throw new errors.InvalidArgumentError("Cannot find activity " + name + ":" + version + " in config");
    }

  }

  public getActivityByRef(reference: string): interfaces.IActivity {

    var configEntries = this.workflow.activities.filter(function (item, index, array) {
      if (item.reference == reference) return true;
    });

    if (configEntries.length > 0) {
      return configEntries[0];
    } else {
      throw new errors.InvalidArgumentError("Cannot find activity " + reference + " in config");
    }

  }

}