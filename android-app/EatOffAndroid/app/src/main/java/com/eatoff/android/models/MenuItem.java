package com.eatoff.android.models;

import com.google.gson.annotations.SerializedName;

public class MenuItem {
    @SerializedName("id")
    private int id;
    
    @SerializedName("restaurantId")
    private int restaurantId;
    
    @SerializedName("name")
    private String name;
    
    @SerializedName("description")
    private String description;
    
    @SerializedName("price")
    private double price;
    
    @SerializedName("category")
    private String category;
    
    @SerializedName("imageUrl")
    private String imageUrl;
    
    @SerializedName("isAvailable")
    private boolean isAvailable;
    
    @SerializedName("isVegetarian")
    private boolean isVegetarian;
    
    @SerializedName("isVegan")
    private boolean isVegan;
    
    @SerializedName("isGlutenFree")
    private boolean isGlutenFree;
    
    @SerializedName("spicyLevel")
    private int spicyLevel;
    
    @SerializedName("preparationTime")
    private int preparationTime;
    
    @SerializedName("calories")
    private Integer calories;
    
    @SerializedName("allergens")
    private String allergens;
    
    // Constructors
    public MenuItem() {}
    
    public MenuItem(int id, String name, double price, String category) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.category = category;
    }
    
    // Getters and Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    
    public int getRestaurantId() { return restaurantId; }
    public void setRestaurantId(int restaurantId) { this.restaurantId = restaurantId; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    
    public boolean isAvailable() { return isAvailable; }
    public void setAvailable(boolean available) { isAvailable = available; }
    
    public boolean isVegetarian() { return isVegetarian; }
    public void setVegetarian(boolean vegetarian) { isVegetarian = vegetarian; }
    
    public boolean isVegan() { return isVegan; }
    public void setVegan(boolean vegan) { isVegan = vegan; }
    
    public boolean isGlutenFree() { return isGlutenFree; }
    public void setGlutenFree(boolean glutenFree) { isGlutenFree = glutenFree; }
    
    public int getSpicyLevel() { return spicyLevel; }
    public void setSpicyLevel(int spicyLevel) { this.spicyLevel = spicyLevel; }
    
    public int getPreparationTime() { return preparationTime; }
    public void setPreparationTime(int preparationTime) { this.preparationTime = preparationTime; }
    
    public Integer getCalories() { return calories; }
    public void setCalories(Integer calories) { this.calories = calories; }
    
    public String getAllergens() { return allergens; }
    public void setAllergens(String allergens) { this.allergens = allergens; }
    
    // Helper methods
    public String getFormattedPrice() {
        return String.format("€%.2f", price);
    }
    
    public String getDietaryBadges() {
        StringBuilder badges = new StringBuilder();
        if (isVegan) badges.append("🌱 Vegan ");
        else if (isVegetarian) badges.append("🥬 Vegetarian ");
        if (isGlutenFree) badges.append("🚫 Gluten-Free ");
        return badges.toString().trim();
    }
    
    public String getSpicyIndicator() {
        if (spicyLevel == 0) return "";
        StringBuilder spicy = new StringBuilder();
        for (int i = 0; i < spicyLevel && i < 3; i++) {
            spicy.append("🌶️");
        }
        return spicy.toString();
    }
    
    public String getPreparationTimeText() {
        if (preparationTime <= 0) return "Quick";
        if (preparationTime < 60) return preparationTime + " min";
        return (preparationTime / 60) + "h " + (preparationTime % 60) + "min";
    }
    
    public String getCaloriesText() {
        return calories != null ? calories + " cal" : "";
    }
    
    public String getAvailabilityText() {
        return isAvailable ? "Available" : "Not Available";
    }
    
    public int getAvailabilityColor() {
        return isAvailable ? android.graphics.Color.GREEN : android.graphics.Color.RED;
    }
    
    public String getItemSummary() {
        StringBuilder summary = new StringBuilder();
        summary.append(name).append(" - ").append(getFormattedPrice());
        
        String dietary = getDietaryBadges();
        if (!dietary.isEmpty()) {
            summary.append(" (").append(dietary).append(")");
        }
        
        return summary.toString();
    }
}