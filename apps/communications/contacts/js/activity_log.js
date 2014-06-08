'use strict';
/* global Promise, utils */
/* exported ActivityLog */

var ActivityLog = (function ActivityLog(){

  var template;
  var target;
  var datastores = {};
  var initialized = false;

  function flattenArray(array) {
    return array.reduce(function(a, b) {
      return a.concat(b);
    });
  }

  // Kind of info (aka name of ds) to consume
  var storeTypes = ['communications', 'messaging'];

  // Stores a reference of the datastores in the system for type
  // of known datastore (storeTypes)
  function getStoreForType(type) {
    return new Promise(function (resolve, reject) {
      navigator.getDataStores(type).then(function (stores) {
        datastores[type] = stores;
        resolve();
      }, reject);
    });
  }

  // Given a kind of activity, queries all the datastores associated to
  // it for a specific user id, obtaining all the data related to that
  // user and the type of store.
  // Returns an array with all the activities (from different datastores)
  // of the same type of datastore.
  function getActivityByType(id, type) {
    return new Promise(function (resolve, reject) {
      var stores = datastores[type];

      if (!stores) {
        reject('No stores for ' + type);
        return;
      }

      var promises = [];
      stores.forEach(function (store) {
        promises.push(store.get(id));
      });

      Promise.all(promises).then(function (activities) {
        var result = flattenArray(activities);
        result.map(function (elem) {
          elem.activityType = type;
        });
        resolve(result);
      }, reject);
    });
  }

  // Given a user id, queries all the datastores to look for activity
  // for the given user.
  // Returns an array of arrays of activity per kind of datastore type.
  function activityLookup(id) {
    var promises = [];
    storeTypes.forEach(function (type) {
      promises.push(getActivityByType(id, type));
    });

    return Promise.all(promises);
  }

  // Given an array of arrays of activities, creates a single array
  // with the activities ordered as a time line.
  function createTimeLine(timeLines) {
    var timeLine = [];
    timeLine = flattenArray(timeLines);

    timeLine.sort(function (a, b) {
      if (a.date > b.date) {
        return -1;
      } else if (a.date < b.date) {
        return 1;
      }
      return 0;
    });

    return Promise.resolve(timeLine);
  }

  // Given a contact id returns the time line of the different known
  // activities on the system by that contact.
  function findContactActivity(id) {
    return activityLookup(id).then(createTimeLine);
  }

  /*
    Given a template to use as render point, get a reference to all
    DS needed if wasn't previously initialized.
    Also requires a dom elmement where we will be appending the
    different templates.
  */
  var init = function init(tmpl, trgt) {
    template = tmpl;
    delete template.dataset.template;
    target = trgt;

    // Fetch the subtemplates and check if we have renderers
    storeTypes.forEach(function (type) {
      var subTemplate = template.querySelector('[data-type="' + type + '"]');
      if (!subTemplate) {
        return;
      }

      template.removeChild(subTemplate);
      if (typesTemplates[type]) {
        typesTemplates[type].template = subTemplate;
      }
    });

    if (initialized) {
      return Promise.resolve();
    }

    // Now fetch the stores for the kind of elements we know
    return new Promise(function (resolve, reject) {
      var promises = [];
      storeTypes.forEach(function (storeT) {
        promises.push(getStoreForType(storeT));
      });

      Promise.all(promises).then(function () {
        initialized = true;
        resolve();
      }, reject);
    });
  };

  /*
    Given a contact id, fetch the activity for that user
    from the different datastores and renders it on a time line.
  */
  var render = function render(contactId) {
    return new Promise(function (resolve, reject) {
      findContactActivity(contactId).then(function (activity) {
        if (activity && Array.isArray(activity) && activity.length > 0) {
          doRender(activity);
        }
      }, reject);
    });
  };

  // <li class="activity" id="activity-log" data-template>
  //   <h2 id="activity-label">Activity</h2>
  //   <div class="item" data-template="comms-#i#" data-type="communications">
  //     <span></span>
  //     <div class="activity">
  //       <h3>#title#</h3>
  //       <sub>#subtitle#</sub>
  //     </div>
  //   </div>
  // </li>
  function doRender(activity) {
    var count = 0;
    var availableTypes = Object.keys(typesTemplates);
    activity.forEach(function (logEntry) {
      var type = logEntry.activityType;
      if (availableTypes.indexOf(type) === -1) {
        return;
      }

      var renderer = typesTemplates[type].renderer;
      var subTemplate = typesTemplates[type].template;

      var info = renderer(logEntry, subTemplate, count++);
      if (info) {
        template.appendChild(info);
      }
    });

    if (count > 0) {
      target.appendChild(template);
    }
  }

  // Specific renderer for communication entries type
  //   <div class="item" data-template="comms-#i#" data-type="communications">
  //     <span></span>
  //     <div>
  //       <h3>#title#</h3>
  //       <sub>#subtitle#</sub>
  //     </div>
  //   </div>
  function communicationsRenderer(activity, tmpl, count) {
    return utils.templates.render(tmpl, {
      i: count,
      title: 'Type of call ' + activity.type + ' | ' + activity.subtype,
      subtitle: new Date(activity.date)
    });
  }

  // Specific renderer for messaging entries type
  //   <div class="item" data-template="messaging-#i#" data-type="messaging">
  //     <span></span>
  //     <div class="activity">
  //       <h3>#title#</h3>
  //       <sub>#subtitle#</sub>
  //     </div>
  //   </div>
  function messagingRenderer(activity, tmpl, count) {
    return utils.templates.render(tmpl, {
      i: count,
      title: 'Type of message ' + activity.type + ' | ' + activity.subtype,
      subtitle: new Date(activity.date)
    });
  }

  // Tuple with renderer name and templae
  // {
  //    'renderer': fn,
  //    'template': tmpl // To be fill on init time
  // }
  var typesTemplates = {
    'communications': {
      'renderer': communicationsRenderer
    },
    'messaging': {
      'renderer': messagingRenderer
    }
  };

  return {
    init: init,
    render: render
  };
})();
