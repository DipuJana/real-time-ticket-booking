import mongoose from "mongoose";

const SHOW_STATUSES = ["SCHEDULED", "CANCELLED"];
const SHOW_FIELDS = [
  "eventId",
  "hallId",
  "startTime",
  "endTime",
  "price",
  "status",
];

function sendValidationError(res, message) {
  return res.status(400).json({ success: false, message });
}

function isValidDate(value) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function validateShowFields(body, { partial }) {
  const suppliedFields = Object.keys(body);

  if (suppliedFields.some((field) => !SHOW_FIELDS.includes(field))) {
    return "Invalid show field";
  }

  for (const field of ["eventId", "hallId"]) {
    if ((!partial || body[field] !== undefined) && !mongoose.Types.ObjectId.isValid(body[field])) {
      return `${field} must be a valid ObjectId`;
    }
  }

  for (const field of ["startTime", "endTime"]) {
    if ((!partial || body[field] !== undefined) && !isValidDate(body[field])) {
      return `${field} must be a valid date`;
    }
  }

  if ((!partial || body.price !== undefined) &&
    (typeof body.price !== "number" || !Number.isFinite(body.price) || body.price < 0)) {
    return "price must be a finite non-negative number";
  }

  if (body.status !== undefined && !SHOW_STATUSES.includes(body.status)) {
    return "status must be SCHEDULED or CANCELLED";
  }

  if (!partial || (body.startTime !== undefined && body.endTime !== undefined)) {
    if (new Date(body.startTime) >= new Date(body.endTime)) {
      return "endTime must be later than startTime";
    }
  }

  if (partial && suppliedFields.length === 0) {
    return "At least one show field is required";
  }

  return null;
}

export function validateEventId(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.eventId)) {
    return sendValidationError(res, "Invalid event ID");
  }
  next();
}

export function validateShowId(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendValidationError(res, "Invalid show ID");
  }
  next();
}

export function validateCreateShow(req, res, next) {
  const error = validateShowFields(req.body ?? {}, { partial: false });
  if (error) return sendValidationError(res, error);
  next();
}

export function validateUpdateShow(req, res, next) {
  const error = validateShowFields(req.body ?? {}, { partial: true });
  if (error) return sendValidationError(res, error);
  next();
}
