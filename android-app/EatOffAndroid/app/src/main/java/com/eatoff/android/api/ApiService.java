package com.eatoff.android.api;

import com.eatoff.android.models.Customer;
import com.eatoff.android.models.MenuItem;
import com.eatoff.android.models.Order;
import com.eatoff.android.models.OrderRequest;
import com.eatoff.android.models.Restaurant;
import com.eatoff.android.models.Voucher;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.Path;
import retrofit2.http.Query;
import java.util.List;

public interface ApiService {
    
    // Authentication
    @POST("auth/login")
    Call<LoginResponse> login(@Body LoginRequest loginRequest);
    
    @POST("auth/logout")
    Call<Void> logout();
    
    // Restaurants
    @GET("restaurants")
    Call<List<Restaurant>> getRestaurants();
    
    @GET("restaurants/{id}")
    Call<Restaurant> getRestaurant(@Path("id") int restaurantId);
    
    @GET("restaurants/{id}/menu")
    Call<List<MenuItem>> getRestaurantMenu(@Path("id") int restaurantId);
    
    @GET("restaurants/{id}/packages")
    Call<List<VoucherPackage>> getRestaurantPackages(@Path("id") int restaurantId);
    
    // Test connection
    @GET("restaurants")
    Call<List<Restaurant>> testConnection(@Query("limit") int limit);
    
    // Customer
    @GET("customers/{id}")
    Call<Customer> getCustomer(@Path("id") int customerId);
    
    @GET("customers/{id}/vouchers")
    Call<List<Voucher>> getCustomerVouchers(@Path("id") int customerId);
    
    @GET("customers/{id}/orders")
    Call<List<Order>> getCustomerOrders(@Path("id") int customerId);
    
    // Orders
    @POST("orders")
    Call<Order> createOrder(@Body OrderRequest orderRequest);
    
    @GET("orders/{id}")
    Call<Order> getOrder(@Path("id") int orderId);
    
    // Vouchers
    @GET("vouchers/{id}")
    Call<Voucher> getVoucher(@Path("id") int voucherId);
    
    @GET("vouchers/{id}/qr-code")
    Call<QRCodeResponse> getVoucherQRCode(@Path("id") int voucherId);
    
    // Voucher package purchase
    @POST("vouchers/purchase")
    Call<VoucherPurchaseResponse> purchaseVoucher(@Body VoucherPurchaseRequest request);
    
    // Payment
    @POST("create-payment-intent")
    Call<PaymentIntentResponse> createPaymentIntent(@Body PaymentIntentRequest request);
    
    // Menu items
    @GET("menu-items/{id}")
    Call<MenuItem> getMenuItem(@Path("id") int menuItemId);
    
    // Search and filters
    @GET("restaurants/search")
    Call<List<Restaurant>> searchRestaurants(
        @Query("query") String query,
        @Query("cuisine") String cuisine,
        @Query("location") String location,
        @Query("priceRange") String priceRange
    );
    
    // Inner classes for API responses
    class LoginResponse {
        private boolean success;
        private String message;
        private Customer customer;
        
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public Customer getCustomer() { return customer; }
        public void setCustomer(Customer customer) { this.customer = customer; }
    }
    
    class VoucherPackage {
        private int id;
        private int restaurantId;
        private String name;
        private String description;
        private int mealCount;
        private double price;
        private double originalPrice;
        private int discountPercentage;
        private int validityMonths;
        private boolean isActive;
        
        // Getters and setters
        public int getId() { return id; }
        public void setId(int id) { this.id = id; }
        
        public int getRestaurantId() { return restaurantId; }
        public void setRestaurantId(int restaurantId) { this.restaurantId = restaurantId; }
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public int getMealCount() { return mealCount; }
        public void setMealCount(int mealCount) { this.mealCount = mealCount; }
        
        public double getPrice() { return price; }
        public void setPrice(double price) { this.price = price; }
        
        public double getOriginalPrice() { return originalPrice; }
        public void setOriginalPrice(double originalPrice) { this.originalPrice = originalPrice; }
        
        public int getDiscountPercentage() { return discountPercentage; }
        public void setDiscountPercentage(int discountPercentage) { this.discountPercentage = discountPercentage; }
        
        public int getValidityMonths() { return validityMonths; }
        public void setValidityMonths(int validityMonths) { this.validityMonths = validityMonths; }
        
        public boolean isActive() { return isActive; }
        public void setActive(boolean active) { isActive = active; }
        
        public String getFormattedPrice() {
            return String.format("€%.2f", price);
        }
        
        public String getFormattedOriginalPrice() {
            return String.format("€%.2f", originalPrice);
        }
        
        public String getFormattedDiscount() {
            return discountPercentage + "% OFF";
        }
        
        public String getSavingsAmount() {
            return String.format("€%.2f", originalPrice - price);
        }
    }
    
    class QRCodeResponse {
        private String qrCode;
        private String format;
        
        public String getQrCode() { return qrCode; }
        public void setQrCode(String qrCode) { this.qrCode = qrCode; }
        
        public String getFormat() { return format; }
        public void setFormat(String format) { this.format = format; }
    }
    
    class VoucherPurchaseRequest {
        private int customerId;
        private int restaurantId;
        private int packageId;
        private String paymentMethod;
        
        public VoucherPurchaseRequest(int customerId, int restaurantId, int packageId, String paymentMethod) {
            this.customerId = customerId;
            this.restaurantId = restaurantId;
            this.packageId = packageId;
            this.paymentMethod = paymentMethod;
        }
        
        public int getCustomerId() { return customerId; }
        public void setCustomerId(int customerId) { this.customerId = customerId; }
        
        public int getRestaurantId() { return restaurantId; }
        public void setRestaurantId(int restaurantId) { this.restaurantId = restaurantId; }
        
        public int getPackageId() { return packageId; }
        public void setPackageId(int packageId) { this.packageId = packageId; }
        
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    }
    
    class VoucherPurchaseResponse {
        private boolean success;
        private String message;
        private Voucher voucher;
        
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public Voucher getVoucher() { return voucher; }
        public void setVoucher(Voucher voucher) { this.voucher = voucher; }
    }
    
    class PaymentIntentRequest {
        private double amount;
        private String currency;
        private int customerId;
        private String description;
        
        public PaymentIntentRequest(double amount, String currency, int customerId, String description) {
            this.amount = amount;
            this.currency = currency;
            this.customerId = customerId;
            this.description = description;
        }
        
        public double getAmount() { return amount; }
        public void setAmount(double amount) { this.amount = amount; }
        
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        
        public int getCustomerId() { return customerId; }
        public void setCustomerId(int customerId) { this.customerId = customerId; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
    
    class PaymentIntentResponse {
        private String clientSecret;
        private String paymentIntentId;
        private boolean success;
        private String message;
        
        public String getClientSecret() { return clientSecret; }
        public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }
        
        public String getPaymentIntentId() { return paymentIntentId; }
        public void setPaymentIntentId(String paymentIntentId) { this.paymentIntentId = paymentIntentId; }
        
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}