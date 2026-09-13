import { HallError } from "./hall.errors.js";

export class HallService {
  constructor({ hallRepository, venueRepository, seatRepository }) {
    this.hallRepository = hallRepository;
    this.venueRepository = venueRepository;
    this.seatRepository = seatRepository;
  }

  async createHall(venueId, hallData) {
    const venue = await this.venueRepository.findVenueById(venueId);

    if (!venue) {
      throw new HallError("Venue not found", 404);
    }

    const capacity = this.getConsistentCapacity(hallData);

    try {
      return await this.hallRepository.create({
        venueId,
        name: hallData.name.trim(),
        totalRows: hallData.totalRows,
        seatsPerRow: hallData.seatsPerRow,
        capacity,
      });
    } catch (error) {
      if (error?.code === 11000) {
        throw new HallError("A hall with this name already exists at this venue", 409);
      }
      throw error;
    }
  }

  async updateHall(hallId, updateData) {
    const hall = await this.hallRepository.findById(hallId);

    if (!hall) {
      throw new HallError("Hall not found", 404);
    }

    const totalRows = updateData.totalRows ?? hall.totalRows;
    const seatsPerRow = updateData.seatsPerRow ?? hall.seatsPerRow;
    const layoutChanged =
      totalRows !== hall.totalRows || seatsPerRow !== hall.seatsPerRow;

    if (layoutChanged) {
      const existingSeats = await this.seatRepository.findByHallId(hallId);
      if (existingSeats.length > 0) {
        throw new HallError(
          "Hall layout cannot be changed after seats have been created",
          409
        );
      }
    }

    const capacity = this.getConsistentCapacity({
      ...updateData,
      totalRows,
      seatsPerRow,
    });

    const changes = {
      ...(updateData.name !== undefined && { name: updateData.name.trim() }),
      ...(updateData.totalRows !== undefined && { totalRows }),
      ...(updateData.seatsPerRow !== undefined && { seatsPerRow }),
      capacity,
    };

    try {
      return await this.hallRepository.updateById(hallId, changes);
    } catch (error) {
      if (error?.code === 11000) {
        throw new HallError("A hall with this name already exists at this venue", 409);
      }
      throw error;
    }
  }

  getConsistentCapacity({ totalRows, seatsPerRow, capacity }) {
    const derivedCapacity = totalRows * seatsPerRow;

    if (capacity !== undefined && capacity !== derivedCapacity) {
      throw new HallError(
        "capacity must equal totalRows multiplied by seatsPerRow"
      );
    }

    return derivedCapacity;
  }
}
