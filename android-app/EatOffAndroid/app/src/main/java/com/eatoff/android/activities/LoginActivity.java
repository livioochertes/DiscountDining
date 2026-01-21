package com.eatoff.android.activities;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.eatoff.android.MainActivity;
import com.eatoff.android.R;
import com.eatoff.android.api.ApiClient;
import com.eatoff.android.api.ApiService;
import com.eatoff.android.api.LoginRequest;
import com.eatoff.android.api.LoginResponse;
import com.eatoff.android.models.Customer;
import com.eatoff.android.models.Restaurant;
import com.eatoff.android.utils.AuthManager;
import com.google.android.material.textfield.TextInputEditText;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import java.util.List;

public class LoginActivity extends AppCompatActivity {
    
    private TextInputEditText emailEditText;
    private TextInputEditText passwordEditText;
    private Button loginButton;
    private Button testConnectionButton;
    private TextView statusTextView;
    
    private ApiService apiService;
    private boolean isLoggingIn = false;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);
        
        // Check if user is already logged in
        if (AuthManager.getInstance(this).isLoggedIn()) {
            navigateToMain();
            return;
        }
        
        initializeViews();
        setupListeners();
        
        apiService = ApiClient.getInstance().getApiService();
    }
    
    private void initializeViews() {
        emailEditText = findViewById(R.id.email_edit_text);
        passwordEditText = findViewById(R.id.password_edit_text);
        loginButton = findViewById(R.id.login_button);
        testConnectionButton = findViewById(R.id.test_connection_button);
        statusTextView = findViewById(R.id.status_text_view);
        
        // Pre-fill demo credentials
        emailEditText.setText("demo@example.com");
        passwordEditText.setText("DemoPassword123!");
    }
    
    private void setupListeners() {
        loginButton.setOnClickListener(v -> attemptLogin());
        testConnectionButton.setOnClickListener(v -> testServerConnection());
    }
    
    private void attemptLogin() {
        if (isLoggingIn) return;
        
        String email = emailEditText.getText().toString().trim();
        String password = passwordEditText.getText().toString().trim();
        
        if (email.isEmpty()) {
            emailEditText.setError("Email is required");
            return;
        }
        
        if (password.isEmpty()) {
            passwordEditText.setError("Password is required");
            return;
        }
        
        performLogin(email, password);
    }
    
    private void performLogin(String email, String password) {
        isLoggingIn = true;
        setLoadingState(true, "Logging in...");
        
        LoginRequest loginRequest = new LoginRequest(email, password);
        Call<LoginResponse> call = apiService.login(loginRequest);
        
        call.enqueue(new Callback<LoginResponse>() {
            @Override
            public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                isLoggingIn = false;
                setLoadingState(false, null);
                
                if (response.isSuccessful() && response.body() != null) {
                    LoginResponse loginResponse = response.body();
                    
                    if (loginResponse.isSuccess() && loginResponse.getCustomer() != null) {
                        // Save user data
                        Customer customer = loginResponse.getCustomer();
                        AuthManager.getInstance(LoginActivity.this).saveUserData(customer);
                        
                        showStatus("Login successful!", true);
                        
                        // Navigate to main activity
                        navigateToMain();
                    } else {
                        String message = loginResponse.getMessage();
                        showStatus("Login failed: " + (message != null ? message : "Unknown error"), false);
                    }
                } else {
                    showStatus("Login failed: Server error (" + response.code() + ")", false);
                }
            }
            
            @Override
            public void onFailure(Call<LoginResponse> call, Throwable t) {
                isLoggingIn = false;
                setLoadingState(false, null);
                showStatus("Login failed: " + t.getMessage(), false);
            }
        });
    }
    
    private void testServerConnection() {
        setLoadingState(true, "Testing connection...");
        
        Call<List<Restaurant>> call = apiService.testConnection(1);
        call.enqueue(new Callback<List<Restaurant>>() {
            @Override
            public void onResponse(Call<List<Restaurant>> call, Response<List<Restaurant>> response) {
                setLoadingState(false, null);
                
                if (response.isSuccessful()) {
                    showStatus("Connected successfully!", true);
                } else {
                    showStatus("Connection failed: Server error (" + response.code() + ")", false);
                }
            }
            
            @Override
            public void onFailure(Call<List<Restaurant>> call, Throwable t) {
                setLoadingState(false, null);
                showStatus("Connection failed: " + t.getMessage(), false);
            }
        });
    }
    
    private void setLoadingState(boolean loading, String message) {
        loginButton.setEnabled(!loading);
        testConnectionButton.setEnabled(!loading);
        
        if (loading && message != null) {
            showStatus(message, true);
        }
    }
    
    private void showStatus(String message, boolean isSuccess) {
        statusTextView.setText(message);
        statusTextView.setTextColor(isSuccess ? 
            getResources().getColor(R.color.success, null) : 
            getResources().getColor(R.color.error, null));
        statusTextView.setVisibility(View.VISIBLE);
        
        // Also show toast for important messages
        if (message.contains("successful") || message.contains("failed")) {
            Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
        }
    }
    
    private void navigateToMain() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
    
    @Override
    public void onBackPressed() {
        // Disable back button to prevent returning to splash screen
        moveTaskToBack(true);
    }
}