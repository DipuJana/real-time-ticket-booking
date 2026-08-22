import {Response} from 'express';

export const handleError=(res:Response,error:any):Response=>{
  console.error(error);
  return res.status(500).json({
    success:false,
    message:'Internal Server Error',
    error:error.message,
  });
}