package com.eatoff.android.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class OrderRequest {
    @SerializedName("customerId")
    private int customerId;
    
    @SerializedName("restaurantId")
    private int restaurantId;
    
    @SerializedName("orderType")
    private String orderType; // "delivery", "pickup", "dine-in"
    
    @SerializedName("items")
    private List<OrderItemRequest> items;
    
    @SerializedName("deliveryAddress")
    private String deliveryAddress;
    
    @SerializedName("specialInstructions")
    private String specialInstructions;
    
    @SerializedName("paymentMethod")
    private String paymentMethod;
    
    // Constructors
    public OrderRequest() {}
    
    public OrderRequest(int customerId, int restaurantId, String orderType) {
        this.customerId = customerId;
        this.restaurantId = restaurantId;
        this.orderType = orderType;
    }
    
    // Getters and Setters
    public int getCustomerId() { return customerId; }
    public void setCustomerId(int customerId) { this.customerId = customerId; }
    
    public int getRestaurantId() { return restaurantId; }
    public void setRestaurantId(int restaurantId) { this.restaurantId = restaurantId; }
    
    public String getOrderType() { return orderType; }
    public void setOrderType(String orderType) { this.orderType = orderType; }
    
    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }
    
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    
    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }
    
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    
    // Inner class for order item request
    public static class OrderItemRequest {
        @SerializedName("menuItemId")
        private int menuItemId;
        
        @SerializedName("quantity")
        private int quantity;
        
        @SerializedName("specialInstructions")
        private String specialInstructions;
        
        public OrderItemRequest() {}
        
        public OrderItemRequest(int menuItemId, int quantity) {
            this.menuItemId = menuItemId;
            this.quantity = quantity;
        }
        
        public int getMenuItemId() { return menuItemId; }
        public void setMenuItemId(int menuItemId) { this.menuItemId = menuItemId; }
        
        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
        
        public String getSpecialInstructions() { return specialInstructions; }
        public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }
    }
}