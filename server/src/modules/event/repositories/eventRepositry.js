import {Event} from '../models/eventModel.js';

export class eventRepository{
  //Event crud

  async createEvent(eventData){
    const event=new Event(eventData);
    return await event.save();
  }
  async findEventById(id){
    return await Event.findById(id).lean();
  }

  async findAllEvents(filter = {}) {
    const query = {};
    if (filter.city) {
        query.city = new RegExp(filter.city, 'i');
    }
    if (filter.category) {
        query.category = filter.category;
    }
    if (filter.status) {
        query.status = filter.status;
    }
    if (filter.search) {
        query.$text = {
            $search: filter.search
        };
    }
    const limit = filter.limit || 20;
    const page = filter.page || 1;
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
        Event.find(query)
            .skip(skip)
            .limit(limit)
            .lean(),

        Event.countDocuments(query)
    ]);
    return {
        events,
        total
    };
}

}