import {Types} from 'mongoose';

export class CreateVenueDto{
  name !:string;
  city !:string;
  address !:string;
  description !:string;
}