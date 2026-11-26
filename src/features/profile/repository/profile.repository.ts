import { UserDocument, UserModel } from '@/features/auth/schema/user.schema';
import { UserChallenge } from '@/features/profile/types/profile.types';
import { mongo } from '@/shared/lib/mongo';

export const profileRepository = {
  async findById(id: string): Promise<UserDocument | null> {
    await mongo.connect();
    return UserModel.findById(id).lean<UserDocument>().exec();
  },

  async findByIds(ids: string[]): Promise<UserDocument[]> {
    await mongo.connect();
    return UserModel.find({ _id: { $in: ids } }).lean<UserDocument[]>().exec();
  },

  async findPublishedExcept(excludeIds: string[]): Promise<UserDocument[]> {
    await mongo.connect();
    return UserModel.find({ published: true, _id: { $nin: excludeIds } })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean<UserDocument[]>()
      .exec();
  },

  async updateById(id: string, data: Partial<UserDocument>): Promise<boolean> {
    await mongo.connect();
    const result = await UserModel.findByIdAndUpdate(id, { $set: data });
    return result !== null;
  },

  async setChallenges(id: string, challenges: UserChallenge[]): Promise<boolean> {
    await mongo.connect();
    const result = await UserModel.updateOne({ _id: id }, { $set: { challenges } });
    return result.matchedCount > 0;
  },

  async setTeamForUsers(ids: string[], teamId: string | null): Promise<void> {
    await mongo.connect();
    await UserModel.updateMany({ _id: { $in: ids } }, { $set: { teamId } });
  },

  async addSkipped(id: string, skippedId: string): Promise<void> {
    await mongo.connect();
    await UserModel.updateOne({ _id: id }, { $addToSet: { skipped: skippedId } });
  },

  async clearSkipped(id: string): Promise<void> {
    await mongo.connect();
    await UserModel.updateOne({ _id: id }, { $set: { skipped: [] } });
  },
};
