import mongoose from "mongoose";

function sendValidationError(res, message) {
  return res.status(400).json({ success: false, message });
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function validateHallFields(body, { partial }) {
  const allowedFields = ["name", "totalRows", "seatsPerRow", "capacity"];
  const suppliedFields = Object.keys(body);

  if (suppliedFields.some((field) => !allowedFields.includes(field))) {
    return "Invalid hall update field";
  }

  if (!partial || body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      return "name must be a non-empty string";
    }
  }

  for (const field of ["totalRows", "seatsPerRow"]) {
    if ((!partial || body[field] !== undefined) && !isPositiveInteger(body[field])) {
      return `${field} must be a positive integer`;
    }
  }

  if (body.capacity !== undefined && !isPositiveInteger(body.capacity)) {
    return "capacity must be a positive integer";
  }

  if (partial && suppliedFields.length === 0) {
    return "At least one hall field is required";
  }

  return null;
}

export function validateVenueId(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.venueId)) {
    return sendValidationError(res, "Invalid venue ID");
  }
  next();
}

export function validateHallId(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return sendValidationError(res, "Invalid hall ID");
  }
  next();
}

export function validateCreateHall(req, res, next) {
  const error = validateHallFields(req.body ?? {}, { partial: false });
  if (error) return sendValidationError(res, error);
  next();
}

export function validateUpdateHall(req, res, next) {
  const error = validateHallFields(req.body ?? {}, { partial: true });
  if (error) return sendValidationError(res, error);
  next();
}
