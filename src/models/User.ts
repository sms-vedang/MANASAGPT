import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  password: string; // In production, hash this
  role: 'admin' | 'shop_owner' | 'data_entry';
  shopId?: mongoose.Types.ObjectId; // For shop owners
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hash in production
  role: { type: String, enum: ['admin', 'shop_owner', 'data_entry'], required: true },
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop' },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);