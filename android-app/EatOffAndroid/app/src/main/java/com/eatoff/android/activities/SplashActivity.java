package com.eatoff.android.activities;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import androidx.appcompat.app.AppCompatActivity;
import com.eatoff.android.R;
import com.eatoff.android.MainActivity;
import com.eatoff.android.utils.AuthManager;

public class SplashActivity extends AppCompatActivity {
    
    private static final int SPLASH_DELAY = 2000; // 2 seconds
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);
        
        // Hide the action bar for full screen experience
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }
        
        // Navigate to appropriate screen after delay
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            navigateToNextScreen();
        }, SPLASH_DELAY);
    }
    
    private void navigateToNextScreen() {
        Intent intent;
        
        // Check if user is already logged in
        if (AuthManager.getInstance(this).isLoggedIn()) {
            intent = new Intent(this, MainActivity.class);
        } else {
            intent = new Intent(this, LoginActivity.class);
        }
        
        startActivity(intent);
        finish();
    }
    
    @Override
    public void onBackPressed() {
        // Disable back button during splash screen
        // Do nothing
    }
}