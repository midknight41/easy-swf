import interfaces = require("./Interfaces");

export class ActivityRegister implements interfaces.IActivityRegister{
    private workflow: interfaces.IOptions;

    constructor(workflow: interfaces.IOptions) {
        this.workflow = workflow;
    }

    public getActivityDescriptor(name: string, version: string): interfaces.IActivityDescriptor {

        var configEntries = this.workflow.activities.filter(function (item, index, array) {
            if (item.name == name && item.version == version) return true;
        });

        if (configEntries.length > 0) {
            return configEntries[0];

        } else {
            throw new Error("Cannot find activity " + name + ":" + version + " in config");
        }
    
    }

    public getActivityDescriptorByRef(reference: string): interfaces.IActivityDescriptor {

        var configEntries = this.workflow.activities.filter(function (item, index, array) {
            if (item.reference == reference) return true;
        });

        if (configEntries.length > 0) {
            return configEntries[0];
        } else {
            throw new Error("Cannot find activity " + reference + " in config");
        }


    }

  public getActivityByRef(reference: string): interfaces.IActivity {

    var configEntries = this.workflow.activities.filter(function (item, index, array) {
      if (item.reference == reference) return true;
    });

    if (configEntries.length > 0) {
      return configEntries[0];
    } else {
      throw new Error("Cannot find activity " + reference + " in config");
    }


  }



}