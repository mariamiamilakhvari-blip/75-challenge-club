import { TeamDocument, TeamModel } from '@/features/team/schema/team.schema';
import { mongo } from '@/shared/lib/mongo';

export const teamRepository = {
  async findById(id: string): Promise<TeamDocument | null> {
    await mongo.connect();
    return TeamModel.findById(id).lean<TeamDocument>().exec();
  },

  async findByIds(ids: string[]): Promise<TeamDocument[]> {
    await mongo.connect();
    return TeamModel.find({ _id: { $in: ids } }).lean<TeamDocument[]>().exec();
  },

  async create(members: string[]): Promise<string> {
    await mongo.connect();
    const doc = await TeamModel.create({ members });
    return doc._id.toString();
  },

  async addMember(teamId: string, userId: string): Promise<void> {
    await mongo.connect();
    await TeamModel.updateOne({ _id: teamId }, { $addToSet: { members: userId } });
  },

  async removeMember(teamId: string, userId: string): Promise<void> {
    await mongo.connect();
    await TeamModel.updateOne({ _id: teamId }, { $pull: { members: userId } });
  },

  async deleteById(teamId: string): Promise<void> {
    await mongo.connect();
    await TeamModel.findByIdAndDelete(teamId);
  },
};
