import mongoose, { Schema, InferSchemaType } from 'mongoose';

const CheckInSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: false, default: null, index: true },
    date: { type: String, required: true },
    challengeKey: { type: String, required: true },
    comment: { type: String, required: false, default: '' },
    joiners: { type: [Schema.Types.ObjectId], ref: 'User', required: true, default: [] },
  },
  { timestamps: true }
);

CheckInSchema.index({ userId: 1, date: 1, challengeKey: 1 }, { unique: true });

export type CheckInDocument = InferSchemaType<typeof CheckInSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const CheckInModel =
  mongoose.models.CheckIn || mongoose.model('CheckIn', CheckInSchema);
