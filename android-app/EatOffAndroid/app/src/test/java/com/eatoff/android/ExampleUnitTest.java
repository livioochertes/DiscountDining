package com.eatoff.android;

import org.junit.Test;

import static org.junit.Assert.*;

/**
 * Example local unit test, which will execute on the development machine (host).
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
public class ExampleUnitTest {
    @Test
    public void addition_isCorrect() {
        assertEquals(4, 2 + 2);
    }
    
    @Test
    public void testRestaurantModel() {
        Restaurant restaurant = new Restaurant(1, "Test Restaurant", "Italian", "Downtown");
        
        assertEquals(1, restaurant.getId());
        assertEquals("Test Restaurant", restaurant.getName());
        assertEquals("Italian", restaurant.getCuisine());
        assertEquals("Downtown", restaurant.getLocation());
    }
}