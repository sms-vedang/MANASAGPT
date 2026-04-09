import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  price: number;
  shopId: mongoose.Types.ObjectId;
  image?: string;
  category: string;
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
  image: { type: String },
  category: { type: String, required: true },
});

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);