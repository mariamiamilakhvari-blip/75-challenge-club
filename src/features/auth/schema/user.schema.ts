import mongoose, { Schema, InferSchemaType } from 'mongoose';

const UserChallengeSchema = new Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    custom: { type: Boolean, required: true, default: false },
    days: { type: [Number], required: true, default: [] },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: false, default: '' },
    avatar: { type: String, required: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
    age: { type: Number, required: false },
    city: { type: String, required: false, default: '' },
    interests: { type: [String], required: true, default: [] },
    timezone: { type: String, required: true, default: 'UTC' },
    challenges: { type: [UserChallengeSchema], required: true, default: [] },
    published: { type: Boolean, required: true, default: false },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: false, default: null },
    streakStart: { type: String, required: false, default: '' },
    lastEvaluated: { type: String, required: false, default: '' },
    skipped: { type: [Schema.Types.ObjectId], required: true, default: [] },
    // billing (Dodo Payments); the in-app trial runs from createdAt
    subscriptionStatus: {
      type: String,
      enum: ['none', 'trialing', 'active', 'cancelled', 'expired'],
      required: true,
      default: 'none',
    },
    subscriptionPlan: { type: String, enum: ['', 'monthly', 'yearly'], required: false, default: '' },
    subscriptionId: { type: String, required: false, default: '' },
    dodoCustomerId: { type: String, required: false, default: '' },
    subscriptionPeriodEnd: { type: Date, required: false, default: null },
    // timestamp of the last applied webhook event, to ignore out-of-order deliveries
    subscriptionEventAt: { type: Date, required: false, default: null },
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UserModel =
  mongoose.models.User || mongoose.model('User', UserSchema);
