export const validate = (schema) => {
  return (req, res, next) => {
    try {
      res.locals.validated = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (error) {
      return res.status(400).json({
        status: "ERROR",
        message: "Invalid input data",
        errors: error.issues,
      });
    }
  };
};