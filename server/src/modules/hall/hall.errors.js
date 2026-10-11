export class HallError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "HallError";
    this.statusCode = statusCode;
  }
}
