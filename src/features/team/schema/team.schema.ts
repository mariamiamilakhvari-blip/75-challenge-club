import mongoose, { Schema, InferSchemaType } from 'mongoose';

const TeamSchema = new Schema(
  {
    members: { type: [Schema.Types.ObjectId], ref: 'User', required: true, default: [] },
  },
  { timestamps: true }
);

export type TeamDocument = InferSchemaType<typeof TeamSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TeamModel =
  mongoose.models.Team || mongoose.model('Team', TeamSchema);
