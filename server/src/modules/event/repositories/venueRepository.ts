import {Types} from "mongoose";
import {Venue, IVenue} from "../models/venue";

export class venueRepository {
  
  // venue crud
  async createVenue(venueData:any):Promise<IVenue | null>{
    const venue=new Venue(venueData);
    return await venue.save();
  }

  async findVenueById(id:string):Promise<IVenue | null>{
    return await Venue.findById(id).lean();
  }

  async findAllVenues():Promise<IVenue[]>{
    return await Venue.find({status:'active'}).lean();
  }

  async updateVenue(id:string,updateData:any):Promise<IVenue | null>{
    return await Venue.findByIdAndUpdate(
      id,
      {$set:updateData},
      {new: true,runValidators:true}
    ).lean()
  }

  async deleteVenue(id:string):Promise<IVenue | null>{
    return await Venue.findByIdAndDelete(id).lean();
  }

}