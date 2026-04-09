import mongoose, { Schema, Document } from 'mongoose';

export interface IPlace extends Document {
  name: string;
  type: 'temple' | 'place';
  description: string;
  timing?: string;
  location: string;
}

const PlaceSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['temple', 'place'], required: true },
  description: { type: String, required: true },
  timing: { type: String },
  location: { type: String, required: true },
});

export default mongoose.models.Place || mongoose.model<IPlace>('Place', PlaceSchema);