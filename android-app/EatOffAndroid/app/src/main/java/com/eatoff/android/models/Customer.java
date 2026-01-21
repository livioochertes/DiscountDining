package com.eatoff.android.models;

import com.google.gson.annotations.SerializedName;

public class Customer {
    @SerializedName("id")
    private int id;
    
    @SerializedName("firstName")
    private String firstName;
    
    @SerializedName("lastName")
    private String lastName;
    
    @SerializedName("email")
    private String email;
    
    @SerializedName("phone")
    private String phone;
    
    @SerializedName("address")
    private String address;
    
    @SerializedName("city")
    private String city;
    
    @SerializedName("postalCode")
    private String postalCode;
    
    @SerializedName("country")
    private String country;
    
    @SerializedName("isActive")
    private boolean isActive;
    
    @SerializedName("loyaltyPoints")
    private int loyaltyPoints;
    
    @SerializedName("totalPointsEarned")
    private int totalPointsEarned;
    
    @SerializedName("membershipTier")
    private String membershipTier;
    
    @SerializedName("accountBalance")
    private double accountBalance;
    
    @SerializedName("lastLoginAt")
    private String lastLoginAt;
    
    @SerializedName("createdAt")
    private String createdAt;
    
    // Constructors
    public Customer() {}
    
    public Customer(int id, String firstName, String lastName, String email) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
    }
    
    // Getters and Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
    
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public int getLoyaltyPoints() { return loyaltyPoints; }
    public void setLoyaltyPoints(int loyaltyPoints) { this.loyaltyPoints = loyaltyPoints; }
    
    public int getTotalPointsEarned() { return totalPointsEarned; }
    public void setTotalPointsEarned(int totalPointsEarned) { this.totalPointsEarned = totalPointsEarned; }
    
    public String getMembershipTier() { return membershipTier; }
    public void setMembershipTier(String membershipTier) { this.membershipTier = membershipTier; }
    
    public double getAccountBalance() { return accountBalance; }
    public void setAccountBalance(double accountBalance) { this.accountBalance = accountBalance; }
    
    public String getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(String lastLoginAt) { this.lastLoginAt = lastLoginAt; }
    
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    
    // Helper methods
    public String getFullName() {
        return firstName + " " + lastName;
    }
    
    public String getFormattedBalance() {
        return String.format("€%.2f", accountBalance);
    }
    
    public String getFormattedPoints() {
        return String.format("%,d", loyaltyPoints);
    }
    
    public String getFullAddress() {
        StringBuilder addressBuilder = new StringBuilder();
        if (address != null) addressBuilder.append(address);
        if (city != null) {
            if (addressBuilder.length() > 0) addressBuilder.append(", ");
            addressBuilder.append(city);
        }
        if (postalCode != null) {
            if (addressBuilder.length() > 0) addressBuilder.append(" ");
            addressBuilder.append(postalCode);
        }
        if (country != null) {
            if (addressBuilder.length() > 0) addressBuilder.append(", ");
            addressBuilder.append(country);
        }
        return addressBuilder.toString();
    }
    
    public String getMembershipColor() {
        switch (membershipTier != null ? membershipTier.toLowerCase() : "bronze") {
            case "silver": return "#C0C0C0";
            case "gold": return "#FFD700";
            case "platinum": return "#E5E4E2";
            default: return "#CD7F32"; // bronze
        }
    }
}