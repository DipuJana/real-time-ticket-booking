import{venueRepository} from '../repositories/venueRepository';
import {Types} from 'mongoose';
import {cacheService} from '../cache/service';
import {CacheKeys} from '../cache/utils/cacheKey';

export class venueService{
  constructor(private VenueRepository:venueRepository){}

  // venue Management

  async createVenue(venueData:any):Promise<any>{
    if(!venueData.name || !venueData.city){
      throw new Error('Venue name and city are required');
    }
    const venue=await this.VenueRepository.createVenue(venueData);
    await cacheService.deletePattern(CacheKeys.venuePattern());
    const venues=await this.VenueRepository.findAllVenues();
    await cacheService.set(CacheKeys.venuesByCity('all'),venues,{ttl:3600});
    return venue;
  }

  async getAllVenues():Promise<any>{
    const cahcheKey=CacheKeys.venuesByCity('all');
    const cached=await cacheService.get<any[]>(cahcheKey);
    if(cached){
      console.log('cache hit');
      return cached;
    }
    console.log('cache miss,hit the database');
    const venues=await this.VenueRepository.findAllVenues();
    await cacheService.set(cahcheKey,venues,{ttl:3600});
    return venues;
  }

  async updateVenue(venueId:string,updateData:any):Promise<any>{
    const venue=await this.VenueRepository.updateVenue(venueId,updateData);
    if(!venue){
      throw new Error(`Venue with id ${venueId} not found.`);
    }
    return venue;
  }

  async deleteVenue(venueId:string):Promise<any>{
    const venue=await this.VenueRepository.deleteVenue(venueId);
    if(!venue){
      throw new Error(`Venue with id ${venueId} not found.`);
    }
    return venue;
  }

}