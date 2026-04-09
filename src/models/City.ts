import mongoose, { Schema, Document } from 'mongoose';

export interface ICity extends Document {
  name: string;
  district: string;
  state: string;
  country: string;
  pincodes: string[];
  population: number;
  area: string;
  wards: {
    total: number;
    list: string[];
  };
  nagarPalika: {
    name: string;
    address: string;
  };
  mla: {
    name: string;
    party: string;
    contact?: string;
  };
  mp: {
    name: string;
    party: string;
    contact?: string;
  };
  policeStations: string[];
  areas: {
    name: string;
    subAreas?: string[];
    streets?: string[];
    tags: string[];
  }[];
  villages: {
    name: string;
    population: number;
    distanceFromCity: string;
    category: 'rural' | 'urban';
  }[];
  institutions: {
    schools: string[];
    colleges: string[];
    hospitals: string[];
    govtOffices: string[];
  };
  culture: {
    festivals: string[];
    famousThings: string[];
    history: string;
  };
  connectivity: {
    busStand: string;
    railwayStation: string;
    highways: string[];
  };
}

const CitySchema: Schema = new Schema({
  name: { type: String, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  pincodes: [{ type: String }],
  population: { type: Number, required: true },
  area: { type: String, required: true },
  wards: {
    total: { type: Number, required: true },
    list: [{ type: String }],
  },
  nagarPalika: {
    name: { type: String, required: true },
    address: { type: String, required: true },
  },
  mla: {
    name: { type: String, required: true },
    party: { type: String, required: true },
    contact: { type: String },
  },
  mp: {
    name: { type: String, required: true },
    party: { type: String, required: true },
    contact: { type: String },
  },
  policeStations: [{ type: String }],
  areas: [{
    name: { type: String, required: true },
    subAreas: [{ type: String }],
    streets: [{ type: String }],
    tags: [{ type: String }],
  }],
  villages: [{
    name: { type: String, required: true },
    population: { type: Number, required: true },
    distanceFromCity: { type: String, required: true },
    category: { type: String, enum: ['rural', 'urban'], required: true },
  }],
  institutions: {
    schools: [{ type: String }],
    colleges: [{ type: String }],
    hospitals: [{ type: String }],
    govtOffices: [{ type: String }],
  },
  culture: {
    festivals: [{ type: String }],
    famousThings: [{ type: String }],
    history: { type: String },
  },
  connectivity: {
    busStand: { type: String },
    railwayStation: { type: String },
    highways: [{ type: String }],
  },
});

export default mongoose.models.City || mongoose.model<ICity>('City', CitySchema);