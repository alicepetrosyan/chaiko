import Recipe from "../models/recipe.model.js";
import mongoose from "mongoose";

export const getRecipes = async (req,res) => {
    try {
        const products = await Recipe.find({});
        res.status(200).json({success: true, data:products});
    } catch (error) {
        console.error("Error in fetching recipes: ", error.message);
        res.status(500).json({success: false, message: "Server Error"});
    }
};

export const createRecipe = async (req,res) => {
    const recipe = req.body; // get recipe data from user
    console.log(req.body);

    if (!recipe.name || !recipe.image || !recipe.syrups) {
        return res.status(400).json({ success: false, message: "Please provide all fields" });
    }

    const newRecipe = new Recipe(recipe);

    try {
        await newRecipe.save();
        res.status(201).json({success: true, data: newRecipe})
    } catch (error) {
        console.error("Error in create recipe:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const updateRecipe = async(req,res) => {
    const {id} = req.params;
    const recipe = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)){
        console.error("Error in update recipe:", error.message);
        res.status(404).json({ success: false, message: "Recipe Not Found" });
    }

    try {
        const updatedRecipe = await Recipe.findByIdAndUpdate(id, recipe, {new:true});
        res.status(200).json({ success:true, message: "Recipe updated", data: updatedRecipe});
    } catch (error) {
        console.error("Error in update recipe:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const deleteRecipe = async(req,res) => { //adding : before id so that it's dynamic
    const {id} = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)){
        console.error("Error in update recipe:", error.message);
        res.status(404).json({ success: false, message: "Recipe Not Found" });
    }

    try {
        await Recipe.findByIdAndDelete(id);
        res.status(200).json({ success:true, message: "Recipe deleted"});
    } catch (error) {
        console.error("Error in delete recipe:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};