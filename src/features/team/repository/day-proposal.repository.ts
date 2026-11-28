import { DayProposalDocument, DayProposalModel } from '@/features/team/schema/day-proposal.schema';
import { mongo } from '@/shared/lib/mongo';

export const dayProposalRepository = {
  async findById(id: string): Promise<DayProposalDocument | null> {
    await mongo.connect();
    return DayProposalModel.findById(id).lean<DayProposalDocument>().exec();
  },

  async findByTeam(teamId: string): Promise<DayProposalDocument[]> {
    await mongo.connect();
    return DayProposalModel.find({ teamId }).lean<DayProposalDocument[]>().exec();
  },

  async deleteByTeamAndChallenge(teamId: string, challengeKey: string): Promise<void> {
    await mongo.connect();
    await DayProposalModel.deleteMany({ teamId, challengeKey });
  },

  async create(data: { teamId: string; challengeKey: string; proposerId: string; days: number[] }): Promise<string> {
    await mongo.connect();
    const doc = await DayProposalModel.create({ ...data, accepted: [data.proposerId], declined: [] });
    return doc._id.toString();
  },

  async accept(id: string, userId: string): Promise<void> {
    await mongo.connect();
    await DayProposalModel.updateOne({ _id: id }, { $addToSet: { accepted: userId }, $pull: { declined: userId } });
  },

  async decline(id: string, userId: string): Promise<void> {
    await mongo.connect();
    await DayProposalModel.updateOne({ _id: id }, { $addToSet: { declined: userId }, $pull: { accepted: userId } });
  },
};
