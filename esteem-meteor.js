var Friends = new Mongo.Collection("Friends");
var Feeds = new Mongo.Collection("Feeds");


//Meteor Client Code
if (Meteor.isClient) {
  Meteor.subscribe("friends");
  Meteor.subscribe("feeds");

  Template.body.events({
    "submit .new-friend": function (event) {
      event.preventDefault();
      var newFriendData = {
        firstName: event.target.firstName.value, 
        lastName: event.target.lastName.value,
        esteem: parseInt(event.target.esteem.value),
        description: event.target.description.value,
      }
      Meteor.call('addFriend', newFriendData);
      event.target.firstName.value = "";
      event.target.lastName.value = "";
      event.target.esteem.value = "";
      event.target.description.value = "";

    },

    "click .hide-completed input": function (e) {
      Session.set('hideCompleted', event.target.checked);
    },

    "click .delete": function () {
      Meteor.call('deleteFriend', this._id);
    },

    "click .toggle-private": function () {
      Meteor.call('setPrivate', this._id, ! this.private);
    },

    "submit .update-esteem": function (event) {
      event.preventDefault();
      var feedData = {
        friendId: this._id,
        firstName: this.firstName,
        delta: parseInt(event.target.delta.value),
        reason: event.target.reason.value,
        createdAt: moment().toISOString(),
        esteemOwner: Meteor.userId(),
      };
      Meteor.call('addToFeeds', 'update', feedData);
      Meteor.call('updateEsteem', this._id, parseInt(event.target.delta.value));
      event.target.delta.value = "";
      event.target.reason.value = "";
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

  Template.body.helpers({
    friends: function () {      
      return Friends.find({}, {sort: {esteem: -1}});
    },

    feeds: function () {
      return Feeds.find({}, {sort: {createdAt: -1}});
    },

  });

  Template.friend.helpers({
    isOwner: function () {
      return this.owner === Meteor.userId();
    },
  });

  Template.feed.helpers({
    isDeltaNegative: function () {
      return this.delta > 0 ? true: false;
    },

    fromNow: function (date) {
      console.log('from fromnow', date);
      return moment(date);
    }
  });
  
  Template.registerHelper('formatDateFromNow', function(date) {
    return moment(date).fromNow();
  });



}


//Meteor Server System

if (Meteor.isServer) {
  Meteor.publish("friends", function () {
    return Friends.find({});
  });
  Meteor.publish("feeds", function () {
    return Feeds.find({});
  });
}

//Shared code between client and Meteor

Meteor.methods({
  addFriend: function(newFriend){
    if( !Meteor.userId()){
      throw new Meteor.Error('NOT_AUTHORIZED');
    }

    newFriend.createdAt = moment().toISOString();
    newFriend.owner = Meteor.userId();      
    Friends.insert(newFriend);

  },

  deleteFriend: function(friendId) {
    var friend = Friends.findOne(friendId);
    if(friend.private && friend.owner !== Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }
    Friends.remove(friendId);
  },

  setChecked: function (friendId, setChecked) {
    Friends.update(friendId,{$set: { checked: setChecked}});
  },

  updateEsteem: function(friendId, delta){
    var friend = Friends.findOne(friendId);
    delta = friend.esteem + delta;
    Friends.update(friendId,{$set: { esteem: delta}});
  },

  addToFeeds: function (typeFeed, feedData) {
    if(typeFeed === 'update') {
      Feeds.insert(feedData);
    } 
    else if (typeFeed === 'newFriend') {
      console.log('Just added a new friend')
    }
  }



});  

