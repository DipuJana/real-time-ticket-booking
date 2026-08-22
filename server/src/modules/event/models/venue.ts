import mongoose,{Schema,Document} from "mongoose";


export interface IVenue extends Document {
    _id:mongoose.Types.ObjectId;
    name:string;
    city:string;
    address:string;
    description:string;
    status:'active' | 'inactive' | 'maintenance';
    createdAt:Date;
    updatedAt:Date;
}

const VenueSchema:Schema<IVenue> = new Schema<IVenue>(
  {
    name: { type: String, required: true ,trim:true},
    city: { type: String, required: true ,trim:true},
    address: { type: String, required: true},
    description: { type: String, required: true},
    status: { 
      type: String, enum:['active','inactive','maintenance'], default:'active' 

    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);


export const Venue = mongoose.model<IVenue>('Venue', VenueSchema);