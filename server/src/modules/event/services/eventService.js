import {cacheService} from '../cache/service.js';
import {CacheKeys} from '../cache/utils/cacheKey.js';
import {cacheInvalidationService} from '../cache/cacheInvalidation.service.js';
import { CreateEventDto, UpdateEventDto, EventResponseDto } from '../dtos/dto.js';


export class eventService {
  constructor(EventRepository) {
    this.EventRepository = EventRepository;
  }

  async createEvent(eventData) {
    const event=await this.EventRepository.createEvent(eventData);
    // const response=new EventResponseDto(event);
    await cacheService.deletePattern(CacheKeys.eventPattern(event._id));
    return event;
  }

  async getAllEvents(filter={}){
    const filterKey=JSON.stringify(filter);
    const cacheKey=CacheKeys.eventsList(filterKey);
    const cached=await cacheService.get(cacheKey);
    if(cached){
      console.log('cache hit');
      return cached;
    }
    console.log('cache miss,hit the database');
    const {events,totalCount}=await this.EventRepository.findAllEvents(filter);
    const result={
      events:events.map(e=>new EventResponseDto(e)),
      totalCount,
      page:filter.page||1,
      limit:filter.limit || 20
    }
    await cacheService.set(cacheKey,result,{ttl:3600});
    return result;
  }

  async getEventById(id){
    const cacheKey=CacheKeys.event(id);
    const cached=await cacheService.get(cacheKey);
    if(cached){
      console.log('cache hit');
      return cached;
    }
    const event=await this.EventRepository.findEventById(id);
    if(!event){
      throw new Error('Event not found');
    }
    // const response=new EventResponseDto(event);
    await cacheService.set(cacheKey,event,{ttl:3600});
    return event;
  }

  async updateEvent(id, eventData) {
    const updatedEvent = await this.EventRepository.updateEvent(id, eventData);
    if (!updatedEvent) {
      throw new Error('Event not found');
    }
    // const response = new EventResponseDto(updatedEvent);
    await cacheInvalidationService.invalidateEventCache(id);
    return updatedEvent;
  }

  async deleteEvent(id) {
    const deletedEvent = await this.EventRepository.deleteEvent(id);
    if(deletedEvent){
      await Promise.all([
        cacheService.delete(CacheKeys.event(id)),
        cacheService.deletePattern(CacheKeys.eventsList('*')),
      ]);
    }
    return deletedEvent;
  }

}