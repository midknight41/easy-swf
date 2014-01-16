/// <reference path="imports.d.ts" />

import AWS = require("aws-sdk");
import async = require("async");

import a = require("./Activity");
import interfaces = require("./Interfaces");
import errors = require("./CustomErrors");

export class EventParser {

    public extractActivities(events: AWS.Swf.HistoryEvent[]): interfaces.IActivity[] {

      if (events == null) throw new errors.NullArgumentError("events is mandatory");

        //var events = this.events;
        var activityIndex: number[] = [];
        var activities: a.Activity[] = [];

        //find all activity related events
        var me = this;

        for (var index = 0; index < events.length; index++) {
            var item = events[index];

            if (item.eventType == "ActivityTaskScheduled") {
                var activity = new a.Activity();

                activity.name = item.activityTaskScheduledEventAttributes.activityType.name;
                activity.version = item.activityTaskScheduledEventAttributes.activityType.version;
                activity.taskList = item.activityTaskScheduledEventAttributes.taskList.name;
                activity.input = item.activityTaskScheduledEventAttributes.input;
                activity.hasBeenScheduled = true;

                activities.push(activity);
                activityIndex.push(index + 1);
            }

            if (item.eventType == "ActivityTaskCompleted") {
                var sid = item.activityTaskCompletedEventAttributes.scheduledEventId;
                var activity = activities[activityIndex.indexOf(sid)];

                activity.result = item.activityTaskCompletedEventAttributes.result;
                activity.hasCompleted = true;

                activities[activityIndex.indexOf(sid)] = activity;
            }

            if (item.eventType == "ActivityTaskStarted") {
                var sid = item.activityTaskStartedEventAttributes.scheduledEventId;
                activities[activityIndex.indexOf(sid)].hasStarted = true;
            }

            if (item.eventType == "ActivityTaskFailed") {
                var sid = item.activityTaskFailedEventAttributes.scheduledEventId;
                activities[activityIndex.indexOf(sid)].hasFailed = true;
            }

            if (item.eventType == "ActivityTaskTimedOut") {
                var sid = item.activityTaskTimedOutEventAttributes.scheduledEventId;
                activities[activityIndex.indexOf(sid)].hasTimedOut = true;
            }

        }

        return (activities);

    }

}
