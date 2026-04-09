import mongoose, { Schema, Document } from 'mongoose';

export interface IQuery extends Document {
  userQuery: string;
  timestamp: Date;
  response?: string;
}

const QuerySchema: Schema = new Schema({
  userQuery: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  response: { type: String },
});

export default mongoose.models.Query || mongoose.model<IQuery>('Query', QuerySchema);