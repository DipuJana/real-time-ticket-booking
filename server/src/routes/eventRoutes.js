import {Router} from 'express';
import {eventController} from '../modules/event/controllers/eventController.js';
import {eventService} from '../modules/event/services/eventService.js';
import {eventRepository} from '../modules/event/repositories/eventRepositry.js';

const router = Router();

// Initialize Dependencies
const EventRepository = new eventRepository();
const EventService = new eventService(EventRepository);
const EventController = new eventController(EventService);

// event Routes
router.post('/createEvents',(req,res)=>EventController.createEvent(req,res));
router.get('/getEvents',(req,res)=>EventController.getAllEvents(req,res));
// router.get('/events/:id',(req,res)=>EventController.getEventById(req,res));
// router.put('/updateEvents/:id',(req,res)=>EventController.updateEvent(req,res));
// router.delete('/deleteEvents/:id',(req,res)=>EventController.deleteEvent(req,res));

export const eventRoutes = router;