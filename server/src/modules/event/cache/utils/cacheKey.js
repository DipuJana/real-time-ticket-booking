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

  // Event cache

  static event(id) {
    return `${this.prefix}:${this.version}:event:${id}`;
  }
  static eventsList(filter) {
    return `${this.prefix}:${this.version}:events:${filter}`;
  }
  static eventsSearch(query) {
    return `${this.prefix}:${this.version}:events:search:${query}`;
  }
  eventsByCategory(category) {
    return `${this.prefix}:${this.version}:events:category:${category}`;
  }
  eventsByCity(city) {
    return `${this.prefix}:${this.version}:events:city:${city}`;
  }

  upcomingEvents(date){
    return `${this.prefix}:${this.version}:events:upcoming:${date}`;
  }

  // Discovery Event
  eventDetail(eventId) {
    return `${this.prefix}:${this.version}:event:detail:${eventId}`;
  }
  eventPattern(eventId) {
    return eventId ? `${this.prefix}:${this.version}:event:*${eventId}*` : `${this.prefix}:${this.version}:event:*`;
  }

}