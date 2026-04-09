import mongoose, { Schema, Document } from 'mongoose';

export interface IShop extends Document {
  name: string;
  category: string;
  address: string;
  phone: string;
  rating: number;
  tags: string[];
  sponsored: boolean;
}

const ShopSchema: Schema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  rating: { type: Number, default: 0 },
  tags: [{ type: String }],
  sponsored: { type: Boolean, default: false },
});

export default mongoose.models.Shop || mongoose.model<IShop>('Shop', ShopSchema);