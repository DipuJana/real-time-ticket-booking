import {Types} from 'mongoose';

export class CreateVenueDto{
  name !:string;
  city !:string;
  address !:string;
  description !:string;
}
// The ! is called the definite assignment assertion."Don't worry, I guarantee this property will be assigned." other wise we can use constructor
