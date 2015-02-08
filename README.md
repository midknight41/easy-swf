
#Easy SWF

Easy SWF is a module made to make using the AWS Simple Workflow Service a little easier to use.

You need to be familiar with how SWF works. This [link](http://docs.aws.amazon.com/amazonswf/latest/developerguide/swf-dg-basic.html) is useful for understanding the core concepts.

##Example config

__REWRITE__

To avoid having to put version numbers and task list names into the code (which gets messy), Easy SWF has a __reference__ attribute in the workflow definition which you use in the code. The other elements match the configuration in the AWS management console.


```
{
	"awsConfig":
		{
			"accessKeyId": "[YourAccessKeyId]",
			"secretAccessKey": "[YourSecretAccessKey]",
			"region": "[YourRegion]"
		},

	"workflow": {
        "domain": "ExampleDomain",
		"reference": "example1",
		"workflowType" : "example1",
		"workflowTypeVersion" : "1",
        "taskList": "taskList",
        "activities": [
            {
                "reference": "taskOne",
                "name": "taskOne",
                "version": "1",
                "taskList": "taskList"
            },
            {
                "reference": "taskTwo",
                "name": "taskTwo",
                "version": "1",
                "taskList": "taskList"
            },
            {
                "reference": "taskThree",
                "name": "taskThree",
                "version": "1",
                "taskList": "taskList"
            }
        ]
    }
}
```

##How to create a client

```
var easy = require("easy-swf");

var workflow = {
	"domain": "ExampleDomain",
	"taskList": "taskList"
};

var awsConfig = {
	"accessKeyId": "[YourAccessKeyId]",
	"secretAccessKey": "[YourSecretAccessKey]",
	"region": "[YourRegion]"
};

var client = new easy.WorkflowClient(workflow, awsConfig);

```

##How to handle activities

```
var acts = client.createActivityHost("taskList");

acts.handleActivity("taskOne", "1", function (data, next) {
  next(null, "one");
});

acts.handleActivity("taskTwo", "1", function (data, next) {
  next(null, data + " two");
});

acts.handleActivity("taskThree", "1", function (data, next) {
  next(null, data + " three");
});

acts.listen(function (err: Error, message: string) {

   //get feedback from activity host
  console.log(message);

});

```

##How the decisions work

```
var decider = client.createDeciderHost("taskList");

decider.handleWorkflow("workflowType", "v1", function decisionLogic(err, context) {

  var taskOne = context.getFunction("taskOne", "1");
  var taskTwo = context.getFunction("taskTwo", "1");
  var taskThree = context.getFunction("taskThree", "1");

  taskOne("input", function (feedErr, feedData) {

    if (feedErr != null) { context.failWorkflow(feedErr); return; }

    taskTwo(feedData, function (summaryErr, summaryData) {

      if (summaryErr != null) { context.failWorkflow(summaryErr); return; }

      taskThree(summaryData, function (finalErr, finalData) {
        if (finalErr != null) { context.failWorkflow(finalErr); return; }

        console.log(finalData);
        context.allDone();
      });

    });

  });

});

decider.listen(function (err, message, context) {

  if (err != null) {
    console.log("[Framework Error]", err);

    if (context != null) {
      context.failWorkflow(err);
      return;
    }
  }

  console.log(message);

});

```

##How to start a workflow
```
client.startWorkflow("workflowType", "v1", function (err) {

});

```
