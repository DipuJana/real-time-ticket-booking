// import {CreateEventDto,UpdateEventDto,EventResponseDto} from '../dtos/eventDto.js';
import { handleError } from '../errors/handleError.js';

export class eventController {
  constructor(eventService) {
    this.eventService = eventService;
  }
  async createEvent(req, res) {
    try{
      const eventData = req.body;
      const event=await this.eventService.createEvent(eventData);
      return res.status(201).json({
        success: true,
        data: event,
        message: 'Event created successfully',
      });

    }
    catch(error){
      return handleError(res, error);
    }
  }

  async getAllEvents(req, res) {
    try{
      const filter={
        category:req.query.category,
        status:req.query.status,
        search:req.query.search,
        city:req.query.city,
        organizer:req.query.organizer,
        hostname:req.query.hostname,
        limit:req.query.limit?parseInt(req.query.limit):20,
        page:req.query.page?parseInt(req.query.page):1,
        dateFrom:req.query.dateFrom,
        dateTo:req.query.dateTo,
        sortBy:req.query.sortBy,
        sortOrder:req.query.sortOrder
      };
      const result=await this.eventService.getAllEvents(filter);
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Events fetched successfully',
      });
    }
    catch(error){
      return handleError(res, error);
    }

  }
  
  async getEventById(req,res){
      try{
        const {id}=req.params;
        const event=await this.eventService.getEventById(id);
        return res.status(200).json({
          success:true,
          data:event,
        })
      }
      catch(error){
        return handleError(res,error);
      }
  }

  async updateEvent(req,res){
    try{
      const {id}=req.params;
      const updateData=req.body;
      const updatedEvent=await this.eventService.updateEvent(id,updateData);
      return res.status(200).json({
        success:true,
        data:updatedEvent,
        message:'Event updated successfully'
      })
    }
    catch(error){
      return handleError(res,error);
    }
  }

  async deleteEvent(req,res){
    try{
      const {id}=req.params;
      const deletedEvent=await this.eventService.deleteEvent(id);
      return res.status(200).json({
        success:true,
        data:deletedEvent,
        message:'Event deleted successfully'
      })
    }
    catch(error){
      return handleError(res,error);
    }
  }




}