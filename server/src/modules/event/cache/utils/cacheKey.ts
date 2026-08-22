export class CacheKeys {
  private static prefix='ticket-booking';
  private static version='v1';


  // venue cache
  public static venue(id:string):string{
    return `${this.prefix}:${this.version}:venue:${id}`;
  }

  static venuesByCity(city: string): string {
    return `${this.prefix}:${this.version}:venues:city:${city}`;
  }
  static venuePattern(venueId?: string): string {
    return venueId ? `${this.prefix}:${this.version}:venue:${venueId}` : `${this.prefix}:${this.version}:venue:*`;
  }

}