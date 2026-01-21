package com.eatoff.android;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.eatoff.android.activities.LoginActivity;
import com.eatoff.android.adapters.RestaurantAdapter;
import com.eatoff.android.api.ApiClient;
import com.eatoff.android.api.ApiService;
import com.eatoff.android.models.Restaurant;
import com.eatoff.android.utils.AuthManager;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import java.util.List;

public class MainActivity extends AppCompatActivity {
    
    private RecyclerView restaurantRecyclerView;
    private RestaurantAdapter restaurantAdapter;
    private SwipeRefreshLayout swipeRefreshLayout;
    private FloatingActionButton cartFab;
    private BottomNavigationView bottomNavigation;
    private MaterialToolbar toolbar;
    
    private ApiService apiService;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // Check authentication
        if (!AuthManager.getInstance(this).isLoggedIn()) {
            navigateToLogin();
            return;
        }
        
        initializeViews();
        setupRecyclerView();
        setupListeners();
        
        apiService = ApiClient.getInstance().getApiService();
        
        loadRestaurants();
    }
    
    private void initializeViews() {
        toolbar = findViewById(R.id.toolbar);
        restaurantRecyclerView = findViewById(R.id.restaurant_recycler_view);
        swipeRefreshLayout = findViewById(R.id.swipe_refresh_layout);
        cartFab = findViewById(R.id.cart_fab);
        bottomNavigation = findViewById(R.id.bottom_navigation);
        
        setSupportActionBar(toolbar);
    }
    
    private void setupRecyclerView() {
        restaurantAdapter = new RestaurantAdapter(this);
        restaurantRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        restaurantRecyclerView.setAdapter(restaurantAdapter);
        
        restaurantAdapter.setOnRestaurantClickListener(new RestaurantAdapter.OnRestaurantClickListener() {
            @Override
            public void onRestaurantClick(Restaurant restaurant) {
                // Navigate to restaurant details (voucher packages)
                // Intent intent = new Intent(MainActivity.this, RestaurantDetailsActivity.class);
                // intent.putExtra("restaurant_id", restaurant.getId());
                // startActivity(intent);
                Toast.makeText(MainActivity.this, "Voucher packages for " + restaurant.getName(), Toast.LENGTH_SHORT).show();
            }
            
            @Override
            public void onViewMenuClick(Restaurant restaurant) {
                // Navigate to restaurant menu
                // Intent intent = new Intent(MainActivity.this, RestaurantMenuActivity.class);
                // intent.putExtra("restaurant_id", restaurant.getId());
                // startActivity(intent);
                Toast.makeText(MainActivity.this, "Menu for " + restaurant.getName(), Toast.LENGTH_SHORT).show();
            }
        });
    }
    
    private void setupListeners() {
        swipeRefreshLayout.setOnRefreshListener(this::loadRestaurants);
        
        cartFab.setOnClickListener(v -> {
            // Navigate to cart
            Toast.makeText(this, "Shopping cart", Toast.LENGTH_SHORT).show();
        });
        
        bottomNavigation.setOnItemSelectedListener(item -> {
            int itemId = item.getItemId();
            if (itemId == R.id.navigation_home) {
                // Already on home
                return true;
            } else if (itemId == R.id.navigation_vouchers) {
                // Navigate to vouchers
                Toast.makeText(this, "My vouchers", Toast.LENGTH_SHORT).show();
                return true;
            } else if (itemId == R.id.navigation_orders) {
                // Navigate to orders
                Toast.makeText(this, "My orders", Toast.LENGTH_SHORT).show();
                return true;
            } else if (itemId == R.id.navigation_profile) {
                // Navigate to profile
                Toast.makeText(this, "Profile", Toast.LENGTH_SHORT).show();
                return true;
            } else if (itemId == R.id.navigation_add) {
                // Navigate to add/cart
                Toast.makeText(this, "Add to cart", Toast.LENGTH_SHORT).show();
                return true;
            }
            return false;
        });
    }
    
    private void loadRestaurants() {
        swipeRefreshLayout.setRefreshing(true);
        
        Call<List<Restaurant>> call = apiService.getRestaurants();
        call.enqueue(new Callback<List<Restaurant>>() {
            @Override
            public void onResponse(Call<List<Restaurant>> call, Response<List<Restaurant>> response) {
                swipeRefreshLayout.setRefreshing(false);
                
                if (response.isSuccessful() && response.body() != null) {
                    List<Restaurant> restaurants = response.body();
                    restaurantAdapter.updateRestaurants(restaurants);
                    
                    if (restaurants.isEmpty()) {
                        Toast.makeText(MainActivity.this, "No restaurants found", Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(MainActivity.this, "Failed to load restaurants", Toast.LENGTH_SHORT).show();
                }
            }
            
            @Override
            public void onFailure(Call<List<Restaurant>> call, Throwable t) {
                swipeRefreshLayout.setRefreshing(false);
                Toast.makeText(MainActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
    
    private void navigateToLogin() {
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        
        // Check if user is still logged in
        if (!AuthManager.getInstance(this).isLoggedIn()) {
            navigateToLogin();
        }
    }
}