import { Router } from 'express';
import { venueController } from '../modules/event/controllers/venueController.js';
import { venueService } from '../modules/event/services/venueService.js';
import { venueRepository } from '../modules/event/repositories/venueRepository.js';
const router = Router();

// Initialize Dependencies
const VenueRepository = new venueRepository();
const VenueService = new venueService(VenueRepository);
const VenueController = new venueController(VenueService);

// venue Routes
router.post('/createVenues', (req, res) => VenueController.createVenue(req, res));
router.get('/getVenues', (req, res) => VenueController.getAllVenues(req, res));
router.put('/updateVenues/:id', (req, res) => VenueController.updateVenue(req, res));
router.delete('/deleteVenues/:id', (req, res) => VenueController.deleteVenue(req, res));
export const venueRoutes = router;