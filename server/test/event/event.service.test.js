import { vi, afterEach, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { eventService } from "../../src/modules/event/services/eventService.js";
import { eventRepository } from "../../src/modules/event/repositories/eventRepositry.js";
import { CacheKeys } from "../../src/modules/event/cache/utils/cacheKey.js";
import { cacheService } from "../../src/modules/event/cache/service.js"
import { cacheInvalidationService } from "../../src/modules/event/cache/cacheInvalidation.service.js"


vi.mock("../../src/modules/event/cache/utils/cacheKey.js");
vi.mock("../../src/modules/event/cache/service.js");
vi.mock("../../src/modules/event/cache/cacheInvalidation.service.js")

describe("EventService", () => {
  let service;
  let mockRepository;
  let mockCacheInvalidationService;
  beforeEach(() => {
    vi.clearAllMocks();
    // mockRepository = new eventRepository();
    mockRepository = {
      createEvent: vi.fn(),
      findAllEvents: vi.fn(),
      findEventById: vi.fn(),
      updateEvent: vi.fn(),
      deleteEvent: vi.fn()
    };
    mockCacheInvalidationService={
      invalidateEventCache:vi.fn()
    };
    service = new eventService(mockRepository);
  });
  let mockEvent;
  beforeEach(() => {
    mockEvent = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      title: 'Test  Concert',
      category: 'stadium',
      dateLocation: 'Kolkata',
      duration: 180,
      city: 'Kolkata',
      language: 'English',
      organizer: 'XYZ Events',
      hostname: 'Netaji Indoor Stadium',
      description: 'A live music concert featuring Arijit Singh.',
      image: [
        'https://example.com/images/event1.jpg',
        'https://example.com/images/event2.jpg'
      ],
      status: 'active',
      posterUrl: 'https://example.com/images/poster.jpg',
      ageRestriction: 'All ages',
      createdAt: new Date(),
      updateAt: new Date(),
      save: vi.fn().mockResolvedValue(this)
    };
  });

  describe("createEvent", () => {
    it("create a mock event", async () => {
      const eventData = {
        title: 'Test  Concert',
        category: 'stadium',
        dateLocation: 'Kolkata',
        duration: 180,
        city: 'Kolkata',
        language: 'English',
        organizer: 'XYZ Events',
        hostname: 'Netaji Indoor Stadium',
        description: 'A live music concert featuring Arijit Singh.',
        image: [
          'https://example.com/images/event1.jpg',
          'https://example.com/images/event2.jpg'
        ],
        status: 'active',
        posterUrl: 'https://example.com/images/poster.jpg',
        ageRestriction: 'All ages'
      };
      mockRepository.createEvent.mockResolvedValue(mockEvent);
      cacheService.deletePattern.mockResolvedValue(true);

      const result = await service.createEvent(eventData);
      expect(mockRepository.createEvent).toHaveBeenCalledWith(eventData);

      expect(result).toEqual(mockEvent);
    });
  });

  describe("getEvent",()=>{
    beforeEach(()=>{
      vi.clearAllMocks();
    });

    it("Get event from cache",async()=>{
      const eventId=mockEvent._id.toString();
      const cachedEvent={id:eventId,title:"Cached Event"};
      cacheService.get.mockResolvedValue(cachedEvent);
      const result=await service.getEventById(eventId);
      expect(cacheService.get).toHaveBeenCalledWith(CacheKeys.event(eventId));
      expect(mockRepository.findEventById).not.toHaveBeenCalled();
      expect(result).toEqual(cachedEvent);
    });


    it("fetch event from database when not in cached", async()=>{
      const eventId=mockEvent._id.toString();
      cacheService.get.mockResolvedValue(null);
      mockRepository.findEventById.mockResolvedValue(mockEvent);
      cacheService.set.mockResolvedValue(true);
      const result=await service.getEventById(eventId);

      expect(cacheService.get).toHaveBeenCalledWith(CacheKeys.event(eventId));
      expect(mockRepository.findEventById).toHaveBeenCalledWith(eventId);
      expect(cacheService.set).toHaveBeenCalled();
      expect(result).toEqual(mockEvent);
    });

    it('should throw error when event not found', async () => {
      const eventId = '507f1f77bcf86cd799439099';
      cacheService.get.mockResolvedValue(null);
      mockRepository.findEventById.mockResolvedValue(null);

      await expect(service.getEventById(eventId))
        .rejects
        .toThrow("Event not found",eventId);
    });
  });

  // describe("updateEvent",()=>{
  //   it("update event and invalidate caches", async()=>{
  //     const eventId=mockEvent._id.toString();
  //     const updateData={
  //       title:"Update concer Title",
  //       status:"active"
  //     };
  //     const updatedEvent={
  //       ...mockEvent,
  //       title:"Update concer Title",
  //       status:"active"
  //     };
  //     mockRepository.updateEvent.mockResolvedValue(updatedEvent);
  //     cacheService.delete.mockResolvedValue(true);
  //     cacheService.deletePattern.mockResolvedValue(true);

  //     const result=await service.updateEvent(eventId,updatedEvent);
  //     expect(mockRepository.updateEvent).toHaveBeenCalledWith(eventId,updateData);
  //     // expect(cacheService.delete).toHaveBeenCalledWith(CacheKeys.event(eventId)); problem
  //     expect(cacheService.deletePattern).toHaveBeenCalledWith(CacheKeys.eventPattern);
  //     expect(result).toEqual(mockEvent);
  //   })
  // })
 

});

