import { CheckInDocument, CheckInModel } from '@/features/checkin/schema/checkin.schema';
import { mongo } from '@/shared/lib/mongo';

export const checkInRepository = {
  async findById(id: string): Promise<CheckInDocument | null> {
    await mongo.connect();
    return CheckInModel.findById(id).lean<CheckInDocument>().exec();
  },

  async findByUserBetween(userId: string, from: string, to: string): Promise<CheckInDocument[]> {
    await mongo.connect();
    return CheckInModel.find({ userId, date: { $gte: from, $lte: to } })
      .lean<CheckInDocument[]>()
      .exec();
  },

  async findByUserAndDate(userId: string, date: string): Promise<CheckInDocument[]> {
    await mongo.connect();
    return CheckInModel.find({ userId, date }).lean<CheckInDocument[]>().exec();
  },

  async findByUsersOnDates(userIds: string[], dates: string[]): Promise<CheckInDocument[]> {
    await mongo.connect();
    return CheckInModel.find({ userId: { $in: userIds }, date: { $in: dates } })
      .lean<CheckInDocument[]>()
      .exec();
  },

  async findCommentedByUsersSince(userIds: string[], since: string): Promise<CheckInDocument[]> {
    await mongo.connect();
    return CheckInModel.find({ userId: { $in: userIds }, date: { $gte: since }, comment: { $ne: '' } })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean<CheckInDocument[]>()
      .exec();
  },

  async create(data: {
    userId: string;
    teamId: string | null;
    date: string;
    challengeKey: string;
    comment: string;
  }): Promise<string> {
    await mongo.connect();
    const doc = await CheckInModel.create({ ...data, joiners: [] });
    return doc._id.toString();
  },

  async deleteById(id: string): Promise<void> {
    await mongo.connect();
    await CheckInModel.findByIdAndDelete(id);
  },

  async addJoiner(id: string, userId: string): Promise<void> {
    await mongo.connect();
    await CheckInModel.updateOne({ _id: id }, { $addToSet: { joiners: userId } });
  },

  async removeJoiner(id: string, userId: string): Promise<void> {
    await mongo.connect();
    await CheckInModel.updateOne({ _id: id }, { $pull: { joiners: userId } });
  },
};
