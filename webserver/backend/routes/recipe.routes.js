import express from "express";
import { createRecipe, getRecipes, updateRecipe, deleteRecipe } from "../controllers/recipe.controller.js";

const router = express.Router();

// get all recipes
router.get("/", getRecipes);

// create new recipe
router.post("/", createRecipe);

// update recipe
router.put("/:id", updateRecipe);

// delete recipe
router.delete("/:id", deleteRecipe);

export default router;