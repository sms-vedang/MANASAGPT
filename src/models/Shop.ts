import mongoose, { Schema, Document } from 'mongoose';

export interface IHomeDelivery {
  enabled: boolean;
  minOrderAmount: number;
  deliveryCharge: number;
  freeDeliveryAbove: number; // 0 = no free delivery threshold
  deliveryRadiusKm: number;
  estimatedTimeMinutes: number;
  deliveryNote: string;
}

export interface IShop extends Document {
  name: string;
  category: string;
  address: string;
  phone: string;
  whatsapp?: string;
  website?: string;
  rating: number;
  tags: string[];
  sponsored: boolean;
  priorityScore: number;
  verified: boolean;
  isOpen: boolean;
  openingHours?: string;
  homeDelivery: IHomeDelivery;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HomeDeliverySchema = new Schema<IHomeDelivery>(
  {
    enabled: { type: Boolean, default: false },
    minOrderAmount: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    freeDeliveryAbove: { type: Number, default: 0 },
    deliveryRadiusKm: { type: Number, default: 0 },
    estimatedTimeMinutes: { type: Number, default: 30 },
    deliveryNote: { type: String, default: '' },
  },
  { _id: false }
);

const ShopSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    whatsapp: { type: String },
    website: { type: String },
    rating: { type: Number, default: 0 },
    tags: [{ type: String }],
    sponsored: { type: Boolean, default: false },
    priorityScore: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    isOpen: { type: Boolean, default: true },
    openingHours: { type: String },
    description: { type: String },
    homeDelivery: { type: HomeDeliverySchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.models.Shop || mongoose.model<IShop>('Shop', ShopSchema);