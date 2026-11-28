import { UserDocument, UserModel } from '@/features/auth/schema/user.schema';
import { SubscriptionStatus } from '@/features/billing/types/billing.types';
import { mongo } from '@/shared/lib/mongo';

export type SubscriptionUpdate = {
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: 'monthly' | 'yearly' | '';
  subscriptionId: string;
  dodoCustomerId: string;
  subscriptionPeriodEnd: Date | null;
  subscriptionEventAt: Date;
};

export const billingRepository = {
  async findById(id: string): Promise<UserDocument | null> {
    await mongo.connect();
    return UserModel.findById(id).lean<UserDocument>().exec();
  },

  async findByEmail(email: string): Promise<UserDocument | null> {
    await mongo.connect();
    return UserModel.findOne({ email }).lean<UserDocument>().exec();
  },

  async updateSubscription(id: string, update: SubscriptionUpdate): Promise<void> {
    await mongo.connect();
    await UserModel.updateOne({ _id: id }, { $set: update });
  },
};
