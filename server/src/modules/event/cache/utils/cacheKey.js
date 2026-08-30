export class CacheKeys {
  static prefix = 'ticket-booking';
  static version = 'v1';

  // venue cache
  static venue(id) {
    return `${this.prefix}:${this.version}:venue:${id}`;
  }

  static venuesByCity(city) {
    return `${this.prefix}:${this.version}:venues:city:${city}`;
  }

  static venuePattern(venueId) {
    return venueId ? `${this.prefix}:${this.version}:venue:${venueId}` : `${this.prefix}:${this.version}:venue:*`;
  }

}