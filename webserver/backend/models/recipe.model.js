import mongoose from "mongoose";

const syrupSchema = new mongoose.Schema({
  name: { type: String },
  pumps: { type: Number }
});

const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  syrups: {
    type: [syrupSchema],
    validate: {
      validator: function(arr) {
        // At least one syrup must have a name and pumps
        return arr.some(s => s.name && s.pumps !== undefined && s.pumps !== null);
      },
      message: "At least one syrup with name and pumps is required"
    }
  }
});

export default mongoose.model("Recipe", recipeSchema);