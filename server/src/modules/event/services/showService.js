import { HallError } from "../../hall/hall.errors.js";

const SHOW_STATUSES = new Set(["SCHEDULED", "CANCELLED"]);

export class ShowService {
  constructor({ showRepository, eventRepository, hallRepository }) {
    this.showRepository = showRepository;
    this.eventRepository = eventRepository;
    this.hallRepository = hallRepository;
  }

  async createShow(showData) {
    const event = await this.eventRepository.findEventById(showData.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const hall = await this.hallRepository.findById(showData.hallId);
    if (!hall) {
      throw new HallError("Hall not found", 404);
    }

    this.validateSchedule(showData.startTime, showData.endTime);
    this.validatePrice(showData.price);

    const overlappingShow = await this.showRepository.findOverlappingShow(
      showData.hallId,
      showData.startTime,
      showData.endTime
    );
    if (overlappingShow) {
      throw new Error("Show overlaps with an existing show in this hall");
    }

    return this.showRepository.create(showData);
  }

  async getShowById(id) {
    const show = await this.showRepository.findById(id);
    if (!show) {
      throw new Error("Show not found");
    }
    return show;
  }

  async getShowsByEventId(eventId) {
    return this.showRepository.findByEventId(eventId);
  }

  async updateShow(id, updateData) {
    const show = await this.getShowById(id);
    const finalHallId = updateData.hallId ?? show.hallId;
    const finalStartTime = updateData.startTime ?? show.startTime;
    const finalEndTime = updateData.endTime ?? show.endTime;
    const scheduleChanged =
      !this.sameId(finalHallId, show.hallId) ||
      !this.sameTime(finalStartTime, show.startTime) ||
      !this.sameTime(finalEndTime, show.endTime);

    if (scheduleChanged) {
      const hasInventory = await this.showRepository.hasInventory(id);
      if (hasInventory) {
        throw new Error(
          "Show hall and schedule cannot be changed after inventory has been created"
        );
      }

      this.validateSchedule(finalStartTime, finalEndTime);

      const overlappingShow = await this.showRepository.findOverlappingShow(
        finalHallId,
        finalStartTime,
        finalEndTime,
        id
      );
      if (overlappingShow) {
        throw new Error("Show overlaps with an existing show in this hall");
      }
    }

    if (updateData.price !== undefined) {
      this.validatePrice(updateData.price);
    }

    if (updateData.status !== undefined && !SHOW_STATUSES.has(updateData.status)) {
      throw new Error("status must be SCHEDULED or CANCELLED");
    }

    return this.showRepository.updateById(id, updateData);
  }

  async cancelShow(id) {
    await this.getShowById(id);
    return this.showRepository.updateById(id, { status: "CANCELLED" });
  }

  validateSchedule(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
      throw new Error("endTime must be later than startTime");
    }
  }

  validatePrice(price) {
    if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
      throw new Error("price must be a finite non-negative number");
    }
  }

  sameId(firstId, secondId) {
    return String(firstId) === String(secondId);
  }

  sameTime(firstTime, secondTime) {
    return new Date(firstTime).getTime() === new Date(secondTime).getTime();
  }
}
