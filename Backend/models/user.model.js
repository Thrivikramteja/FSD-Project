const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const donorSchema = new mongoose.Schema({
  userId: { type: Number, unique: true },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  mobile_number: {
    type: String,
    required: true,
  },
  receive_notifications: {
    type: Boolean,
    default: false,
  },
});

donorSchema.plugin(AutoIncrement, { inc_field: "userId" });

donorSchema.statics.getUserByEmail = async function (email) {
  const user = await this.findOne({ email });
  return user;
};

donorSchema.statics.getUserByUserId = function (userId) {
  return this.findOne({ userId });
};

donorSchema.methods.signup = async function () {
  const hashedPassword = await bcrypt.hash(this.password, 12);
  this.password = hashedPassword;

  await this.save();
};

donorSchema.statics.getname = async function (userId) {
  const user = await this.findOne({ userId });
  console.log(user.name);
  return user.name;
};

const userRegisteredEventsSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
  },
  ngoId: {
    type: Number,
    required: true,
  },
  event_name: {
    type: String,
    required: true,
  },
  event_date: {
    type: Date,
    required: true,
  },
  event_location: {
    type: String,
    required: true,
  },
  // ADD THIS ONE FIELD
  eventObjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event', 
    required: true,
  }
});


donorSchema.statics.participatedEvents = async function (userId) {
  const currentDate = new Date();
  
  const events = await UserRegisteredEvent.aggregate([
    // Match user's registrations
    { $match: { userId: userId } },
    
    // Lookup current event data using eventObjectId
    {
      $lookup: {
        from: 'events', // Your events collection name
        localField: 'eventObjectId',
        foreignField: '_id',
        as: 'eventData'
      }
    },
    
    
    { $unwind: '$eventData' },
    
    
    {
      $match: {
        'eventData.event_date': { $lt: currentDate }
      }
    }
  ]);
  
  return events;
};

donorSchema.statics.upcomingEvents = async function (userId) {
  const currentDate = new Date();
  
  const upcoming = await UserRegisteredEvent.aggregate([
    
    { $match: { userId: userId } },
    
    
    {
      $lookup: {
        from: 'events', 
        localField: 'eventObjectId',
        foreignField: '_id',
        as: 'eventData'
      }
    },
    
    
    { $unwind: '$eventData' },
    
    
    {
      $match: {
        'eventData.event_date': { $gt: currentDate }
      }
    }
  ]);
  
  return upcoming;
};


const userContributedFundraisersSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
  },
  ngoId: {
    type: Number,
    required: true,
  },
  fundraiser_name: {
    type: String,
    required: true,
  },
  amount_contributed: {
    type: Number,
    required: true,
  },
  contributed_at: {
    type: Date,
    default: Date.now,
  },
  deadline: {
    type: Date,
    required: true,
  },

  fundraiserObjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreatedFundraiser',
    required: true,
  }
});

donorSchema.statics.contributedFundraisers = async function (userId) 
{
  const currentDate = new Date();
  const fundraisers = await UserContributedFundraiser.find({
    userId: userId,
    deadline: {$lt: currentDate},
  }).sort({ contributed_at: -1 });
  return fundraisers;
};

const createdFundraisersSchema = new mongoose.Schema({
  carehomeId: {
    type: Number,
    required: true,
  },
  fundraiser_name: {
    type: String,
    required: true,
  },
  ngoId: {
    type: Number,
    required: true,
  },

  goal_amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  amount_raised_so_far: {
    type: Number,
    default: 0,
  },
  deadline: {
    type: Date,
    required: true,
  },
  imagePath: {  
    type: String,
    required: true, 
  },
    tag: {
    type: String,
    enum: [
      "Health",
      "Education",
      "General",
      "Emergency",
      "Environment",
      "Animal Welfare",
      "Others",
    ],
    default: "General",
  },
});

const donate_it_message = new mongoose.Schema({
  carehomeId: {
    type: Number,
    required: true
  },
  userId: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  delivery_date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  description: {
    type: String,
  }
});

const accept_or_rejct = new mongoose.Schema({
  carehomeId: {
    type: Number,
    require: true
  },
  userId: {
    type: Number,
    require: true
  },
  message: {
    type: String,
    reuiqre: true
  },
  category: {
    type: String,
    require: true
  },
  delivery:{
    type: Date,
    require: true
  },
  when_date: {
    type: Date,
    require: true
  }
});

accept_or_rejct.statics.get_newmessages = async function(userId) {
  const messages = await user_message
    .find({ userId: userId })
    .sort({ when_date: -1 }) // Sort by `when_date` in descending order
    .limit(4); // Limit to the latest 4 messages
  return messages;
};

donorSchema.statics.ongoingfund = async function (userId) {
  const currentDate = new Date();
  const fundraisers = await UserContributedFundraiser.find({
    userId: userId,
    deadline: {$gte: currentDate},
  });
  return fundraisers;
};

const User = mongoose.model("Donor", donorSchema);
const CreatedFundraiser = mongoose.model(
  "CreatedFundraiser",
  createdFundraisersSchema
);
const UserRegisteredEvent = mongoose.model(
  "UserRegisteredEvent",
  userRegisteredEventsSchema
);
const UserContributedFundraiser = mongoose.model(
  "UserContributedFundraiser",
  userContributedFundraisersSchema
);

const donate_items_mes = mongoose.model(
  "donate_items_mes",
  donate_it_message
);

const user_message = mongoose.model(
  "user_message",
  accept_or_rejct
);

module.exports = {
  User,
  CreatedFundraiser,
  UserContributedFundraiser,
  UserRegisteredEvent,
  donate_items_mes,
  user_message
};
