#Easy SWF

Easy SWF is a module made to make using the AWS Simple Workflow Service a little easier to use. At the moment this is just experimental and pretty unstable.

You need to be familiar with how SWF works. This [link](http://docs.aws.amazon.com/amazonswf/latest/developerguide/swf-dg-basic.html) is useful for understanding the core concepts.

##Example config

To avoid having to put version numbers and task list names into the code (which gets messy), Easy SWF has a __reference__ attribute in the workflow definition which you use in the code. The other elements match the configuration in the AWS management console.


```
{
	"awsConfig":
		{
			"accessKeyId": "[YourAccessKeyId]",
			"secretAccessKey": "[YourSecretAccessKey]",
			"region": "[YourRegion]"
		},

	"workflow": 
		{
			"domain": "Examples",
			"reference": "ExampleWorkflow",
			"workflowType" : "ExampleWorkflow",
			"workflowTypeVersion" : "1",
			"taskList": "mainList",
			"activities":
			[{
				"reference": "Activity1",
				"name": "Activity1",
				"version": "1",
				"taskList": "mainList"
			}, {
				"reference": "Activity2", 
				"name": "Activity2",
				"version": "1",
				"taskList": "mainList"
			}]
		}
}
```

##How to create a client

```
var easy = require("easy-swf");

var nconf = require('nconf');
nconf.file('./config.json');

var workflow = nconf.get("workflow");
var awsConfig = nconf.get("awsConfig");

var client = new easy.WorkflowClient(workflow, awsConfig);

```

##How to handle activities

```
var taskList = workflow.taskList;

var acts = client.createActivityHost(taskList);

acts.handleActivity("Activity1", function activity1(err, data, next) {

    next(null, "data");

});

acts.handleActivity("Activity2", function activity2(err, data, next) {

    next(null, "data");

});

acts.listen();
```


##How the decisions work

```

var decider = client.createDeciderHost(taskList);

decider.listen(function decisionLogic(err, context) {

	if(err!=null) console.log("oh dear");

    var activity1 = context.getActivityState("Activity1");
    var activity2 = context.getActivityState("Activity2");
    
    if (activity1.hasBeenScheduled == false) {
        context.doActivity(activity1);
        return;

    } else {

        if (activity1.hasCompleted == true) {

            if (activity2.hasBeenScheduled == false) {
				//pass the data from one activity to the next
				context.doActivity(activity2, activity1.result);
                return;
            }

            if (activity2.hasCompleted == true) {
                context.allDone();
                return;
            }
        }
    }
});

```

##How to start a workflow
```
client.startWorkflow("ExampleWorkflow", function errorHandler(err) {

});
```

