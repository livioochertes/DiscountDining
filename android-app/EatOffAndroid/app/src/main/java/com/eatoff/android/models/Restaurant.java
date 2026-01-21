package com.eatoff.android.models;

import com.google.gson.annotations.SerializedName;

public class Restaurant {
    @SerializedName("id")
    private int id;
    
    @SerializedName("ownerId")
    private Integer ownerId;
    
    @SerializedName("name")
    private String name;
    
    @SerializedName("cuisine")
    private String cuisine;
    
    @SerializedName("location")
    private String location;
    
    @SerializedName("address")
    private String address;
    
    @SerializedName("phone")
    private String phone;
    
    @SerializedName("email")
    private String email;
    
    @SerializedName("description")
    private String description;
    
    @SerializedName("rating")
    private Object rating; // Can be String or Double
    
    @SerializedName("priceRange")
    private String priceRange;
    
    @SerializedName("imageUrl")
    private String imageUrl;
    
    @SerializedName("operatingHours")
    private String operatingHours;
    
    @SerializedName("isActive")
    private boolean isActive;
    
    @SerializedName("offersDelivery")
    private boolean offersDelivery;
    
    @SerializedName("offersTakeout")
    private boolean offersTakeout;
    
    @SerializedName("dineInAvailable")
    private boolean dineInAvailable;
    
    @SerializedName("deliveryRadius")
    private Double deliveryRadius;
    
    @SerializedName("deliveryFee")
    private Double deliveryFee;
    
    @SerializedName("minimumDeliveryOrder")
    private Double minimumDeliveryOrder;
    
    @SerializedName("createdAt")
    private String createdAt;
    
    @SerializedName("updatedAt")
    private String updatedAt;
    
    // Constructors
    public Restaurant() {}
    
    public Restaurant(int id, String name, String cuisine, String location) {
        this.id = id;
        this.name = name;
        this.cuisine = cuisine;
        this.location = location;
    }
    
    // Getters and Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    
    public Integer getOwnerId() { return ownerId; }
    public void setOwnerId(Integer ownerId) { this.ownerId = ownerId; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getCuisine() { return cuisine; }
    public void setCuisine(String cuisine) { this.cuisine = cuisine; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Object getRating() { return rating; }
    public void setRating(Object rating) { this.rating = rating; }
    
    public String getPriceRange() { return priceRange; }
    public void setPriceRange(String priceRange) { this.priceRange = priceRange; }
    
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    
    public String getOperatingHours() { return operatingHours; }
    public void setOperatingHours(String operatingHours) { this.operatingHours = operatingHours; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public boolean isOffersDelivery() { return offersDelivery; }
    public void setOffersDelivery(boolean offersDelivery) { this.offersDelivery = offersDelivery; }
    
    public boolean isOffersTakeout() { return offersTakeout; }
    public void setOffersTakeout(boolean offersTakeout) { this.offersTakeout = offersTakeout; }
    
    public boolean isDineInAvailable() { return dineInAvailable; }
    public void setDineInAvailable(boolean dineInAvailable) { this.dineInAvailable = dineInAvailable; }
    
    public Double getDeliveryRadius() { return deliveryRadius; }
    public void setDeliveryRadius(Double deliveryRadius) { this.deliveryRadius = deliveryRadius; }
    
    public Double getDeliveryFee() { return deliveryFee; }
    public void setDeliveryFee(Double deliveryFee) { this.deliveryFee = deliveryFee; }
    
    public Double getMinimumDeliveryOrder() { return minimumDeliveryOrder; }
    public void setMinimumDeliveryOrder(Double minimumDeliveryOrder) { this.minimumDeliveryOrder = minimumDeliveryOrder; }
    
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
    
    // Helper methods
    public String getFormattedRating() {
        if (rating == null) return "N/A";
        
        try {
            if (rating instanceof String) {
                double ratingValue = Double.parseDouble((String) rating);
                return String.format("%.1f", ratingValue);
            } else if (rating instanceof Number) {
                return String.format("%.1f", ((Number) rating).doubleValue());
            }
        } catch (NumberFormatException e) {
            // If parsing fails, return the string value
            return rating.toString();
        }
        
        return "N/A";
    }
    
    public double getRatingValue() {
        if (rating == null) return 0.0;
        
        try {
            if (rating instanceof String) {
                return Double.parseDouble((String) rating);
            } else if (rating instanceof Number) {
                return ((Number) rating).doubleValue();
            }
        } catch (NumberFormatException e) {
            return 0.0;
        }
        
        return 0.0;
    }
    
    public String getFormattedDeliveryFee() {
        if (deliveryFee == null) return "Free";
        return String.format("€%.2f", deliveryFee);
    }
    
    public String getFormattedMinimumOrder() {
        if (minimumDeliveryOrder == null) return "No minimum";
        return String.format("€%.2f", minimumDeliveryOrder);
    }
    
    public String getDeliveryInfo() {
        if (!offersDelivery) return "No delivery";
        
        StringBuilder info = new StringBuilder();
        info.append("Delivery: ").append(getFormattedDeliveryFee());
        
        if (minimumDeliveryOrder != null && minimumDeliveryOrder > 0) {
            info.append(" (min ").append(getFormattedMinimumOrder()).append(")");
        }
        
        return info.toString();
    }
    
    public String getServiceTypes() {
        StringBuilder services = new StringBuilder();
        
        if (dineInAvailable) services.append("Dine-in ");
        if (offersTakeout) services.append("Takeout ");
        if (offersDelivery) services.append("Delivery ");
        
        String result = services.toString().trim();
        return result.isEmpty() ? "Contact restaurant" : result;
    }
    
    public String getStatusText() {
        return isActive ? "Open" : "Closed";
    }
    
    public int getStatusColor() {
        return isActive ? android.graphics.Color.GREEN : android.graphics.Color.RED;
    }
    
    public String getFullAddress() {
        StringBuilder fullAddress = new StringBuilder();
        
        if (address != null && !address.isEmpty()) {
            fullAddress.append(address);
        }
        
        if (location != null && !location.isEmpty()) {
            if (fullAddress.length() > 0) {
                fullAddress.append(", ");
            }
            fullAddress.append(location);
        }
        
        return fullAddress.toString();
    }
    
    public String getContactInfo() {
        StringBuilder contact = new StringBuilder();
        
        if (phone != null && !phone.isEmpty()) {
            contact.append("📞 ").append(phone);
        }
        
        if (email != null && !email.isEmpty()) {
            if (contact.length() > 0) {
                contact.append(" | ");
            }
            contact.append("✉️ ").append(email);
        }
        
        return contact.toString();
    }
}