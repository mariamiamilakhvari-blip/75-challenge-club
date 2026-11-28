import { PlanDocument, PlanModel } from '@/features/team/schema/plan.schema';
import { mongo } from '@/shared/lib/mongo';
import { PlanDetails } from '@/shared/utils/plan-rules';

export const planRepository = {
  async findById(id: string): Promise<PlanDocument | null> {
    await mongo.connect();
    return PlanModel.findById(id).lean<PlanDocument>().exec();
  },

  async findByTeamSince(teamId: string, since: Date): Promise<PlanDocument[]> {
    await mongo.connect();
    return PlanModel.find({ teamId, createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(60)
      .lean<PlanDocument[]>()
      .exec();
  },

  async create(data: { teamId: string; userId: string; challengeKey: string } & PlanDetails): Promise<string> {
    await mongo.connect();
    const doc = await PlanModel.create({ ...data, joiners: [], replies: [] });
    return doc._id.toString();
  },

  async addReply(id: string, userId: string, text: string): Promise<void> {
    await mongo.connect();
    await PlanModel.updateOne({ _id: id }, { $push: { replies: { userId, text } } });
  },

  async addJoiner(id: string, userId: string): Promise<void> {
    await mongo.connect();
    await PlanModel.updateOne({ _id: id }, { $addToSet: { joiners: userId } });
  },

  async removeJoiner(id: string, userId: string): Promise<void> {
    await mongo.connect();
    await PlanModel.updateOne({ _id: id }, { $pull: { joiners: userId } });
  },

  async deleteById(id: string): Promise<void> {
    await mongo.connect();
    await PlanModel.findByIdAndDelete(id);
  },
};
