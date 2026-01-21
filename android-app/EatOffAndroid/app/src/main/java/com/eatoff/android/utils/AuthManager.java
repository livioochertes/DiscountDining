package com.eatoff.android.utils;

import android.content.Context;
import android.content.SharedPreferences;
import com.eatoff.android.models.Customer;
import com.google.gson.Gson;

public class AuthManager {
    
    private static final String PREF_NAME = "eatoff_auth";
    private static final String KEY_IS_LOGGED_IN = "is_logged_in";
    private static final String KEY_USER_DATA = "user_data";
    private static final String KEY_AUTH_TOKEN = "auth_token";
    
    private static AuthManager instance;
    private SharedPreferences preferences;
    private Gson gson;
    
    private AuthManager(Context context) {
        preferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        gson = new Gson();
    }
    
    public static synchronized AuthManager getInstance(Context context) {
        if (instance == null) {
            instance = new AuthManager(context.getApplicationContext());
        }
        return instance;
    }
    
    public void saveUserData(Customer customer) {
        SharedPreferences.Editor editor = preferences.edit();
        editor.putBoolean(KEY_IS_LOGGED_IN, true);
        editor.putString(KEY_USER_DATA, gson.toJson(customer));
        editor.apply();
    }
    
    public Customer getUserData() {
        String userData = preferences.getString(KEY_USER_DATA, null);
        if (userData != null) {
            try {
                return gson.fromJson(userData, Customer.class);
            } catch (Exception e) {
                // Clear corrupted data
                logout();
                return null;
            }
        }
        return null;
    }
    
    public boolean isLoggedIn() {
        return preferences.getBoolean(KEY_IS_LOGGED_IN, false) && getUserData() != null;
    }
    
    public void saveAuthToken(String token) {
        SharedPreferences.Editor editor = preferences.edit();
        editor.putString(KEY_AUTH_TOKEN, token);
        editor.apply();
    }
    
    public String getAuthToken() {
        return preferences.getString(KEY_AUTH_TOKEN, null);
    }
    
    public void logout() {
        SharedPreferences.Editor editor = preferences.edit();
        editor.clear();
        editor.apply();
    }
    
    public int getCurrentUserId() {
        Customer customer = getUserData();
        return customer != null ? customer.getId() : -1;
    }
    
    public String getCurrentUserName() {
        Customer customer = getUserData();
        if (customer != null) {
            String firstName = customer.getFirstName();
            String lastName = customer.getLastName();
            
            if (firstName != null && lastName != null) {
                return firstName + " " + lastName;
            } else if (firstName != null) {
                return firstName;
            } else if (lastName != null) {
                return lastName;
            }
        }
        return "User";
    }
    
    public String getCurrentUserEmail() {
        Customer customer = getUserData();
        return customer != null ? customer.getEmail() : "";
    }
}