package com.eatoff.android.models;

import com.google.gson.annotations.SerializedName;
import java.util.Date;
import java.util.List;

public class Order {
    @SerializedName("id")
    private int id;
    
    @SerializedName("customerId")
    private int customerId;
    
    @SerializedName("restaurantId")
    private int restaurantId;
    
    @SerializedName("orderNumber")
    private String orderNumber;
    
    @SerializedName("status")
    private String status;
    
    @SerializedName("orderType")
    private String orderType; // "delivery", "pickup", "dine-in"
    
    @SerializedName("subtotal")
    private double subtotal;
    
    @SerializedName("deliveryFee")
    private double deliveryFee;
    
    @SerializedName("taxAmount")
    private double taxAmount;
    
    @SerializedName("totalAmount")
    private double totalAmount;
    
    @SerializedName("paymentMethod")
    private String paymentMethod;
    
    @SerializedName("deliveryAddress")
    private String deliveryAddress;
    
    @SerializedName("specialInstructions")
    private String specialInstructions;
    
    @SerializedName("estimatedDeliveryTime")
    private Date estimatedDeliveryTime;
    
    @SerializedName("createdAt")
    private Date createdAt;
    
    @SerializedName("updatedAt")
    private Date updatedAt;
    
    @SerializedName("restaurantName")
    private String restaurantName;
    
    @SerializedName("items")
    private List<OrderItem> items;
    
    // Constructors
    public Order() {}
    
    public Order(int id, int customerId, int restaurantId, String orderNumber) {
        this.id = id;
        this.customerId = customerId;
        this.restaurantId = restaurantId;
        this.orderNumber = orderNumber;
    }
    
    // Getters and Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    
    public int getCustomerId() { return customerId; }
    public void setCustomerId(int customerId) { this.customerId = customerId; }
    
    public int getRestaurantId() { return restaurantId; }
    public void setRestaurantId(int restaurantId) { this.restaurantId = restaurantId; }
    
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getOrderType() { return orderType; }
    public void setOrderType(String orderType) { this.orderType = orderType; }
    
    public double getSubtotal() { return subtotal; }
    public void setSubtotal(double subtotal) { this.subtotal = subtotal; }
    
    public double getDeliveryFee() { return deliveryFee; }
    public void setDeliveryFee(double deliveryFee) { this.deliveryFee = deliveryFee; }
    
    public double getTaxAmount() { return taxAmount; }
    public void setTaxAmount(double taxAmount) { this.taxAmount = taxAmount; }
    
    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }
    
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    
    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }
    
    public Date getEstimatedDeliveryTime() { return estimatedDeliveryTime; }
    public void setEstimatedDeliveryTime(Date estimatedDeliveryTime) { this.estimatedDeliveryTime = estimatedDeliveryTime; }
    
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
    
    public Date getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Date updatedAt) { this.updatedAt = updatedAt; }
    
    public String getRestaurantName() { return restaurantName; }
    public void setRestaurantName(String restaurantName) { this.restaurantName = restaurantName; }
    
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
    
    // Helper methods
    public String getFormattedTotal() {
        return String.format("€%.2f", totalAmount);
    }
    
    public String getFormattedSubtotal() {
        return String.format("€%.2f", subtotal);
    }
    
    public String getFormattedDeliveryFee() {
        return String.format("€%.2f", deliveryFee);
    }
    
    public String getFormattedTax() {
        return String.format("€%.2f", taxAmount);
    }
    
    public String getStatusText() {
        if (status == null) return "Unknown";
        
        switch (status.toLowerCase()) {
            case "pending": return "Order Received";
            case "confirmed": return "Confirmed";
            case "preparing": return "Preparing";
            case "ready": return "Ready";
            case "out_for_delivery": return "Out for Delivery";
            case "delivered": return "Delivered";
            case "pickup_ready": return "Ready for Pickup";
            case "completed": return "Completed";
            case "cancelled": return "Cancelled";
            default: return status;
        }
    }
    
    public int getStatusColor() {
        if (status == null) return android.graphics.Color.GRAY;
        
        switch (status.toLowerCase()) {
            case "pending": return android.graphics.Color.YELLOW;
            case "confirmed":
            case "preparing": return android.graphics.Color.BLUE;
            case "ready":
            case "out_for_delivery": return android.graphics.Color.parseColor("#FF9800"); // Orange
            case "delivered":
            case "completed": return android.graphics.Color.GREEN;
            case "cancelled": return android.graphics.Color.RED;
            default: return android.graphics.Color.GRAY;
        }
    }
    
    public String getOrderTypeText() {
        if (orderType == null) return "Unknown";
        
        switch (orderType.toLowerCase()) {
            case "delivery": return "Delivery";
            case "pickup": return "Pickup";
            case "dine-in": return "Dine-in";
            default: return orderType;
        }
    }
    
    public String getEstimatedTimeText() {
        if (estimatedDeliveryTime == null) return "Unknown";
        
        long diff = estimatedDeliveryTime.getTime() - System.currentTimeMillis();
        if (diff < 0) return "Overdue";
        
        long minutes = diff / (60 * 1000);
        if (minutes < 60) return minutes + " min";
        
        long hours = minutes / 60;
        minutes = minutes % 60;
        return hours + "h " + minutes + "min";
    }
    
    public int getItemCount() {
        if (items == null) return 0;
        return items.stream().mapToInt(OrderItem::getQuantity).sum();
    }
    
    public String getItemSummary() {
        if (items == null || items.isEmpty()) return "No items";
        
        StringBuilder summary = new StringBuilder();
        for (int i = 0; i < Math.min(items.size(), 3); i++) {
            OrderItem item = items.get(i);
            if (i > 0) summary.append(", ");
            summary.append(item.getItemName());
            if (item.getQuantity() > 1) {
                summary.append(" x").append(item.getQuantity());
            }
        }
        
        if (items.size() > 3) {
            summary.append(" and ").append(items.size() - 3).append(" more");
        }
        
        return summary.toString();
    }
    
    public boolean canBeCancelled() {
        return status != null && 
               (status.equalsIgnoreCase("pending") || status.equalsIgnoreCase("confirmed"));
    }
    
    public boolean isCompleted() {
        return status != null && 
               (status.equalsIgnoreCase("delivered") || status.equalsIgnoreCase("completed"));
    }
}