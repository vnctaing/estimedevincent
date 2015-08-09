var Friends = new Mongo.Collection("tasks");


if (Meteor.isClient) {
  Meteor.subscribe("tasks");

  Template.body.events({
    "submit .new-friend": function (event) {
      event.preventDefault();
      var newFriendData = {
        firstName: event.target.firstName.value, 
        lastName: event.target.lastName.value,
        esteem: event.target.esteem.value,
        description: event.target.description.value,
      }
      Meteor.call('addFriend', newFriendData);
      _.mapObject(event.target, function(field){
        console.log(field);
      });

    },

    // "click .hide-completed input": function (e) {
    //   Session.set('hideCompleted', event.target.checked);
    // },

    "click .delete": function () {
      Meteor.call('deleteFriend', this._id);
    },

    "click .toggle-private": function () {
      Meteor.call('setPrivate', this._id, ! this.private);
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

  Template.body.helpers({
    friends: function () {
      if(Session.get("hideCompleted")){
        return Friends.find(
          {sort: {createdAt: -1}}
        );
      }else{        
        return Friends.find({}, {sort: {createdAt: -1}});
      }
    },

    hideCompleted: function () {
      return Session.get("hideCompleted");
    },
  });

  Template.friend.helpers({
    isOwner: function () {
      return this.owner === Meteor.userId();
    },
  });


}


//Meteor Server System

if (Meteor.isServer) {
  Meteor.publish("tasks", function () {
    return Friends.find({});
  });
}

//Shared code between client and Meteor

Meteor.methods({
  addFriend: function(newFriend){
    if( !Meteor.userId()){
      throw new Meteor.Error('NOT_AUTHORIZED');
    }

    newFriend.createdAt = new Date();
    newFriend.owner = Meteor.userId();      
    Friends.insert(newFriend);

  },

  deleteFriend: function(taskId) {
    var friend = Friends.findOne(taskId);
    if(friend.private && friend.owner !== Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }
    Friends.remove(taskId);
  },

  setChecked: function (taskId, setChecked) {

    Friends.update(taskId,{$set: { checked: setChecked}});
  },



});  

