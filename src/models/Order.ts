import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  productId?: mongoose.Types.ObjectId;
  productName: string;
  productPrice: number;
  shopId?: mongoose.Types.ObjectId;
  shopName: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    productPrice: { type: Number, required: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop' },
    shopName: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
      default: 'pending',
    },
    note: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
