package com.eatoff.android.adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.bumptech.glide.Glide;
import com.bumptech.glide.load.resource.drawable.DrawableTransitionOptions;
import com.eatoff.android.R;
import com.eatoff.android.models.Restaurant;
import java.util.ArrayList;
import java.util.List;

public class RestaurantAdapter extends RecyclerView.Adapter<RestaurantAdapter.RestaurantViewHolder> {
    
    private List<Restaurant> restaurants;
    private Context context;
    private OnRestaurantClickListener listener;
    
    public interface OnRestaurantClickListener {
        void onRestaurantClick(Restaurant restaurant);
        void onViewMenuClick(Restaurant restaurant);
    }
    
    public RestaurantAdapter(Context context) {
        this.context = context;
        this.restaurants = new ArrayList<>();
    }
    
    public void setOnRestaurantClickListener(OnRestaurantClickListener listener) {
        this.listener = listener;
    }
    
    public void updateRestaurants(List<Restaurant> newRestaurants) {
        this.restaurants.clear();
        if (newRestaurants != null) {
            this.restaurants.addAll(newRestaurants);
        }
        notifyDataSetChanged();
    }
    
    @NonNull
    @Override
    public RestaurantViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_restaurant, parent, false);
        return new RestaurantViewHolder(view);
    }
    
    @Override
    public void onBindViewHolder(@NonNull RestaurantViewHolder holder, int position) {
        Restaurant restaurant = restaurants.get(position);
        holder.bind(restaurant);
    }
    
    @Override
    public int getItemCount() {
        return restaurants.size();
    }
    
    class RestaurantViewHolder extends RecyclerView.ViewHolder {
        
        private ImageView restaurantImage;
        private TextView restaurantName;
        private TextView restaurantRating;
        private TextView restaurantCuisine;
        private TextView restaurantPriceRange;
        private TextView restaurantLocation;
        private TextView restaurantDescription;
        private Button voucherPackagesButton;
        private Button viewMenuButton;
        
        public RestaurantViewHolder(@NonNull View itemView) {
            super(itemView);
            
            restaurantImage = itemView.findViewById(R.id.restaurant_image);
            restaurantName = itemView.findViewById(R.id.restaurant_name);
            restaurantRating = itemView.findViewById(R.id.restaurant_rating);
            restaurantCuisine = itemView.findViewById(R.id.restaurant_cuisine);
            restaurantPriceRange = itemView.findViewById(R.id.restaurant_price_range);
            restaurantLocation = itemView.findViewById(R.id.restaurant_location);
            restaurantDescription = itemView.findViewById(R.id.restaurant_description);
            voucherPackagesButton = itemView.findViewById(R.id.voucher_packages_button);
            viewMenuButton = itemView.findViewById(R.id.view_menu_button);
        }
        
        public void bind(Restaurant restaurant) {
            // Set basic information
            restaurantName.setText(restaurant.getName());
            restaurantCuisine.setText(restaurant.getCuisine());
            restaurantPriceRange.setText(restaurant.getPriceRange());
            restaurantLocation.setText(restaurant.getLocation());
            restaurantDescription.setText(restaurant.getDescription());
            
            // Set rating
            String rating = restaurant.getFormattedRating();
            restaurantRating.setText(rating);
            
            // Load restaurant image
            if (restaurant.getImageUrl() != null && !restaurant.getImageUrl().isEmpty()) {
                Glide.with(context)
                    .load(restaurant.getImageUrl())
                    .placeholder(R.drawable.ic_restaurant_placeholder)
                    .error(R.drawable.ic_restaurant_placeholder)
                    .transition(DrawableTransitionOptions.withCrossFade())
                    .into(restaurantImage);
            } else {
                restaurantImage.setImageResource(R.drawable.ic_restaurant_placeholder);
            }
            
            // Set click listeners
            voucherPackagesButton.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onRestaurantClick(restaurant);
                }
            });
            
            viewMenuButton.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onViewMenuClick(restaurant);
                }
            });
            
            // Make entire card clickable for voucher packages
            itemView.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onRestaurantClick(restaurant);
                }
            });
        }
    }
}