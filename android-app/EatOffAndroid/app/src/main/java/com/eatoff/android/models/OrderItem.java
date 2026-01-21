package com.eatoff.android.models;

import com.google.gson.annotations.SerializedName;

public class OrderItem {
    @SerializedName("id")
    private int id;
    
    @SerializedName("orderId")
    private int orderId;
    
    @SerializedName("menuItemId")
    private int menuItemId;
    
    @SerializedName("quantity")
    private int quantity;
    
    @SerializedName("unitPrice")
    private double unitPrice;
    
    @SerializedName("totalPrice")
    private double totalPrice;
    
    @SerializedName("specialInstructions")
    private String specialInstructions;
    
    @SerializedName("itemName")
    private String itemName;
    
    @SerializedName("itemDescription")
    private String itemDescription;
    
    // Constructors
    public OrderItem() {}
    
    public OrderItem(int menuItemId, int quantity, double unitPrice) {
        this.menuItemId = menuItemId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalPrice = quantity * unitPrice;
    }
    
    // Getters and Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    
    public int getOrderId() { return orderId; }
    public void setOrderId(int orderId) { this.orderId = orderId; }
    
    public int getMenuItemId() { return menuItemId; }
    public void setMenuItemId(int menuItemId) { this.menuItemId = menuItemId; }
    
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { 
        this.quantity = quantity;
        this.totalPrice = quantity * unitPrice;
    }
    
    public double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(double unitPrice) { 
        this.unitPrice = unitPrice;
        this.totalPrice = quantity * unitPrice;
    }
    
    public double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(double totalPrice) { this.totalPrice = totalPrice; }
    
    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }
    
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    
    public String getItemDescription() { return itemDescription; }
    public void setItemDescription(String itemDescription) { this.itemDescription = itemDescription; }
    
    // Helper methods
    public String getFormattedUnitPrice() {
        return String.format("€%.2f", unitPrice);
    }
    
    public String getFormattedTotalPrice() {
        return String.format("€%.2f", totalPrice);
    }
    
    public String getQuantityText() {
        return "x" + quantity;
    }
    
    public String getItemSummary() {
        StringBuilder summary = new StringBuilder();
        summary.append(itemName != null ? itemName : "Unknown Item");
        summary.append(" ").append(getQuantityText());
        
        if (specialInstructions != null && !specialInstructions.isEmpty()) {
            summary.append(" (").append(specialInstructions).append(")");
        }
        
        return summary.toString();
    }
    
    public String getPriceBreakdown() {
        if (quantity == 1) {
            return getFormattedTotalPrice();
        } else {
            return getFormattedUnitPrice() + " x " + quantity + " = " + getFormattedTotalPrice();
        }
    }
}