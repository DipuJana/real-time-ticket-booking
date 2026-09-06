export const handleError = (res, error) => {
  console.error(error);
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: error.message,
  });
};