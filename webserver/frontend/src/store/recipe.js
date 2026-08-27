import { create } from "zustand"

export const useRecipeCatalog = create((set) => ({
    recipes: [],
    setRecipes: (recipes) => set({ recipes }),
    createRecipe: async (newRecipe) => { 
    if (!newRecipe.name || !newRecipe.image) {
      return { success: false, message: "Name and image are required fields." };
    }

    const hasAtLeastOneSyrup = newRecipe.syrups.some(
      (syrup) => syrup.name && syrup.pumps !== undefined && syrup.pumps !== null
    );

    if (!hasAtLeastOneSyrup) {
      return { success: false, message: "At least one syrup must be added to the recipe" };
    }
        const res = await fetch('http://localhost:8000/api/recipes', {
        // const res = await fetch('http://192.168.0.185:8000/api/recipes', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newRecipe)
        })
        const data = await res.json();
        set ((state) => ({ recipes: [...state.recipes, data.data] }));
        return { success: true, message: "Recipe created successfully." }
        
    },
    fetchRecipes: async () => {
        const res = await fetch('http://localhost:8000/api/recipes');
        // const res = await fetch('http://192.168.0.185:8000/api/recipes');
        const data = await res.json();
        set({ recipes: data.data });
    },
    deleteRecipe: async (id) => {
         const res = await fetch(`http://localhost:8000/api/recipes/${id}`, {
         // const res = await fetch(`http://192.168.0.185:8000/api/recipes/${id}`, {
            method: "DELETE"
        });
        const data = await res.json();
        if(!data.success)
            return { success: false, message: data.message };
        set((state) => ({ recipes: state.recipes.filter((recipe) => recipe._id !== id) }));
        return { success: true, message: data.message }
    },
    editRecipe: async (id, updatedRecipe) => {
        if (!updatedRecipe.name || !updatedRecipe.image) {
            return { success: false, message: "Name and image are required fields." };
}
        const hasAtLeastOneSyrup = updatedRecipe.syrups.some(
            (syrup) => syrup.name && syrup.pumps !== undefined && syrup.pumps !== null && syrup.pumps !== '');
        if (!hasAtLeastOneSyrup) {
            return { success: false, message: "At least one syrup must be added to the recipe" };
        }
        const res = await fetch(`http://localhost:8000/api/recipes/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedRecipe)
        });
        const data = await res.json();
        if (!data.success)
            return { success: false, message: data.message };
        set((state) => ({
            recipes: state.recipes.map((recipe) =>
                recipe._id === id ? data.data : recipe
            )
        }));
        return { success: true, message: "Recipe updated successfully." };
    },
}));

export const syrupOrder = create((set) => ({
  order: [], // Initialize order state
  setOrder: (newOrder) => set({ order: newOrder }),
  fetchOrder: async () => {
    try {
      const res = await fetch('http://localhost:8000/api/config');
      // const res = await fetch('http://192.168.0.185:8000/api/config');
      const data = await res.json();
      set({ order: data.data });
    } catch (error) {
      console.error('Error fetching syrup order:', error);
      set({ order: [] }); // Fallback to an empty array on error
    }
  },
  saveOrder: async (updatedOrder) => {
    try {
      const response = await fetch('http://localhost:8000/api/config', {
      // const response = await fetch('http://192.168.0.185:8000/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order: updatedOrder }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save syrup order: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Syrup order saved successfully:', data);
      set({ order: updatedOrder }); // Update the order state locally
    } catch (error) {
      console.error('Error saving syrup order:', error);
    }
  },
}));