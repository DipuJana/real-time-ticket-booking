import {Request, Response} from 'express';
import {venueService} from '../services/venueService';
import {handleError} from '../errors/handleError';
import {CreateVenueDto} from '../dtos/dto';

export class venueController{
  constructor(private VenueService:venueService){}

  public async createVenue(req:Request,res:Response):Promise<Response>{
    try{
      const venueData:CreateVenueDto=req.body;
      const venue=await this.VenueService.createVenue(venueData);
      return res.status(201).json({
        success:true,
        data:venue,
        message:'Venue created successfully',});
    }
    catch(error){
      return handleError(res,error);
    }
}

public async getAllVenues(req:Request,res:Response):Promise<Response>{
  try{
    const venues=await this.VenueService.getAllVenues();
    return res.status(200).json({
      success:true,
      data:venues,
      message:'Venues fetched successfully',
    });
  }
  catch(error){
    return handleError(res,error);
  }
}

async updateVenue(req:Request,res:Response):Promise<Response>{
  try{
    const { id }=req.params;
    const updateData=req.body;
    const updatedVenue=await this.VenueService.updateVenue(id as string,updateData);
    return res.status(200).json({
      success:true,
      data:updatedVenue,
      message:'Venue updated successfully',
    })
  }
  catch(error){
    return handleError(res,error);
  }
}

async deleteVenue(req:Request,res:Response):Promise<Response>{
  try{
    const { id }=req.params;
    const deletedVenue=await this.VenueService.deleteVenue(id as string);
    return res.status(200).json({
      success:true,
      data:deletedVenue,
      message:'Venue deleted successfully',
    })
  }
  catch(error){
    return handleError(res,error);
  }
}

}