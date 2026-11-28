import mongoose, { Schema, InferSchemaType } from 'mongoose';

const PlanReplySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const PlanSchema = new Schema(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    challengeKey: { type: String, required: true },
    place: { type: String, required: false, default: '' },
    when: { type: String, required: false, default: '' },
    activity: { type: String, required: false, default: '' },
    book: { type: String, required: false, default: '' },
    author: { type: String, required: false, default: '' },
    note: { type: String, required: false, default: '' },
    joiners: { type: [Schema.Types.ObjectId], ref: 'User', required: true, default: [] },
    replies: { type: [PlanReplySchema], required: true, default: [] },
  },
  { timestamps: true }
);

export type PlanDocument = InferSchemaType<typeof PlanSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type PlanReplyDocument = InferSchemaType<typeof PlanReplySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PlanModel = mongoose.models.Plan || mongoose.model('Plan', PlanSchema);
