import mongoose, { Schema, Document } from 'mongoose';

export interface IAd extends Document {
  type: string;
  priority: number;
  startDate: Date;
  endDate?: Date;
  content: string;
  shopId?: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
}

const AdSchema: Schema = new Schema({
  type: { type: String, required: true }, // e.g., 'sponsored', 'banner', 'featured'
  priority: { type: Number, default: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  content: { type: String, required: true },
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop' },
  productId: { type: Schema.Types.ObjectId, ref: 'Product' },
});

export default mongoose.models.Ad || mongoose.model<IAd>('Ad', AdSchema);