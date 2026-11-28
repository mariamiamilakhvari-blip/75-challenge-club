import mongoose, { Schema, InferSchemaType } from 'mongoose';

const DayProposalSchema = new Schema(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    challengeKey: { type: String, required: true },
    proposerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    days: { type: [Number], required: true, default: [] },
    accepted: { type: [Schema.Types.ObjectId], ref: 'User', required: true, default: [] },
    declined: { type: [Schema.Types.ObjectId], ref: 'User', required: true, default: [] },
  },
  { timestamps: true }
);

DayProposalSchema.index({ teamId: 1, challengeKey: 1 });

export type DayProposalDocument = InferSchemaType<typeof DayProposalSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const DayProposalModel = mongoose.models.DayProposal || mongoose.model('DayProposal', DayProposalSchema);
