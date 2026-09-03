export class CreateVenueDto {
  name;
  city;
  address;
  description;
}
export class CreateEventDto {
  constructor(data) {
    this.title = data.title;
    this.category = data.category;
    this.dateLocation = data.dateLocation;
    this.city = data.city;
    this.duration = data.duration;
    this.language = data.language;
    this.organizer = data.organizer;
    this.hostname = data.hostname;
    this.description = data.description;
    this.image = data.image;
    this.status = data.status;
    this.posterUrl = data.posterUrl;
    this.ageRestriction = data.ageRestriction;
  }
}

export class UpdateEventDto {
  constructor(data) {
    this.title = data.title;
    this.category = data.category;
    this.dateLocation = data.dateLocation;
    this.duration = data.duration;
    this.city = data.city;
    this.language = data.language;
    this.organizer = data.organizer;
    this.hostname = data.hostname;
    this.description = data.description;
    this.image = data.image;
    this.status = data.status;
    this.posterUrl = data.posterUrl;
    this.ageRestriction = data.ageRestriction;
  }
}

export class EventResponseDto {
  constructor(data) {
    this.title = data.title;
    this.category = data.category;
    this.dateLocation = data.dateLocation;
    this.duration = data.duration;
    this.city = data.city;
    this.language = data.language;
    this.organizer = data.organizer;
    this.hostname = data.hostname;
    this.description = data.description;
    this.image = data.image;
    this.status = data.status;
    this.posterUrl = data.posterUrl;
    this.ageRestriction = data.ageRestriction;
  }
}