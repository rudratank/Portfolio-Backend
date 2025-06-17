const connection = (databaseurl) => {
  return mongoose
    .connect(databaseurl)
    .then(() => console.log("Database Connection Successful..."))
    .catch((err) => {
      console.log("Database Connection Error", err);
      throw err; // Rethrow so caller knows connection failed
    });
};
