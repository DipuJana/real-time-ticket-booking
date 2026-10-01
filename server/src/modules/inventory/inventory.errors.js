export class InventoryError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "InventoryError";
    this.statusCode = statusCode;
  }
}

export class InventoryNotFoundError extends InventoryError {
  constructor(message = "Inventory resource not found") {
    super(message, 404);
    this.name = "InventoryNotFoundError";
  }
}

export class InventoryConflictError extends InventoryError {
  constructor(message) {
    super(message, 409);
    this.name = "InventoryConflictError";
  }
}